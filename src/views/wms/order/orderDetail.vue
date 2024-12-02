<template>
  <div>
    <div
      class="receipt-order-edit-wrapper app-container"
      style="margin-bottom: 60px"
      v-loading="loading"
    >
      <el-card>
        <el-form :model="form" ref="orderForm" label-width="100px">
          <el-form-item label="订单状态：" prop="status">
            <el-select v-model="form.status" placeholder="请选择">
              <el-option
                v-for="item in order_status.filter(
                  (item) => item.value !== '1'
                )"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="买家信息：" prop="userId">
            <el-input
              v-model="form.user"
              placeholder="请输入"
              disabled
              style="width: 220px"
            ></el-input>
          </el-form-item>
          <el-form-item label="订单信息：" prop="order">
            <el-descriptions border>
              <el-descriptions-item label="订单编号">
                {{ form.id }}</el-descriptions-item
              >
              <el-descriptions-item label="订单类型">{{
                order_type.find((i) => i.value === form.type)?.label
              }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{
                form.createTime
              }}</el-descriptions-item>
              <el-descriptions-item label="订单总额">{{
                `￥ ${form.totalAmount}`
              }}</el-descriptions-item>
              <el-descriptions-item label="备注">{{
                form.remark
              }}</el-descriptions-item>
            </el-descriptions>
          </el-form-item>
        </el-form>
      </el-card>
      <el-card header="商品明细" class="mt10">
        <el-form
          label-width="108px"
          :model="form"
          ref="orderForm"
          :rules="rules"
        >
          <div class="receipt-order-content">
            <el-table
              :data="form.merchandises"
              border
              empty-text="暂无商品明细"
            >
              <el-table-column label="商品编号" prop="id" />
              <el-table-column label="FNSKU" prop="fnsku" />
              <el-table-column label="ASIN" prop="asin" />
              <el-table-column label="商品名称" prop="name" />
              <el-table-column
                label="图片"
                align="center"
                prop="image"
                width="100"
              >
                <template #default="scope">
                  <image-preview
                    :src="scope.row.image"
                    :width="50"
                    :height="50"
                  />
                </template>
              </el-table-column>
              <el-table-column label="尺寸" prop="size" />
              <el-table-column label="颜色" prop="color" />
              <el-table-column label="型号" prop="type" />
              <el-table-column label="单价" prop="price" />
              <el-table-column
                label="选项"
                prop="labelOption"
                align="center"
                width="200"
              >
                <template #default="{ row }">
                  <el-tag v-for="item in row.labelOption" :key="item.value">
                    {{ order_option.find((i) => i.value === item).label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                label="订单需求数量"
                prop="quantityRequired"
                width="150"
                align="center"
              />
              <el-table-column
                label="已通知发货数量"
                prop="totalQuantityNotice"
                width="150"
                align="center"
              />
            </el-table>
          </div>
        </el-form>
      </el-card>
      <el-card class="mt10">
        <template #header>
          <div class="flex-space-between mb8">
            <div>发货通知单</div>
            <el-button
              type="primary"
              plain="plain"
              size="default"
              @click="showAddItem"
              icon="Plus"
              v-hasPermi="['wms:shipmentNotice:add']"
              :disabled="disableCreate"
              >创建发货通知单</el-button
            >
          </div>
        </template>
        <div class="receipt-order-content">
          <el-table
            :data="form.shipmentNotices"
            border
            empty-text="暂无发货通知单"
          >
            <el-table-column label="发货通知单号" prop="id" />
            <el-table-column
              prop="merchandises"
              label="商品信息"
              width="500"
              align="center"
            >
              <template #default="{ row }">
                <div
                  v-for="item in row.merchandises"
                  :key="item.id"
                  class="goods-info"
                >
                  <el-image
                    :src="item.image"
                    :preview-src-list="[item.image]"
                    fit="cover"
                    class="goods-image"
                  />
                  <div class="goods-info-content">
                    <span>{{ `商品名称：${item.name}` }}</span>
                    <span>{{ `商品型号：${item.type}` }}</span>
                    <span>{{ `商品规格：${item.color}   ${item.size}` }}</span>
                  </div>
                  <div class="goods-info-content">
                    <span>{{ `单价：${item.price}￥` }}</span>
                    <span>{{ `数量：${item.quantityNotice}` }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              label="配送方式"
              prop="deliveryMethod"
              align="center"
              width="200"
            >
              <template #default="{ row }">
                {{
                  logisticsList.find((i) => i.id === row.deliveryMethod)?.name
                }}
              </template>
            </el-table-column>
            <el-table-column
              label="状态"
              prop="status"
              align="center"
              width="200"
            >
              <template #default="{ row }">
                <dict-tag
                  :value="row.status"
                  :options="shipping_notice_status"
                />
              </template>
            </el-table-column>
            <el-table-column
              label="创建时间"
              prop="createTime"
              align="center"
              width="200"
            />
            <el-table-column
              label="操作"
              align="center"
              class-name="small-padding fixed-width"
            >
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  @click="handleViewDetail(scope.row)"
                  v-hasPermi="['wms:shipmentNotice:query']"
                  >查看详情</el-button
                >
                <el-button
                  link
                  type="primary"
                  @click="handleAdd(scope.row)"
                  v-hasPermi="['wms:shipment:add']"
                  v-if="['1', '2'].includes(scope.row.status)"
                  >创建发货单</el-button
                >
                <el-button
                  link
                  type="primary"
                  @click="handleDelete(scope.row)"
                  v-hasPermi="['wms:shipmentNotice:remove']"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
    <div class="footer-global">
      <div class="btn-box">
        <div></div>
        <div>
          <el-button @click="saveOrder" type="primary">保存</el-button>
          <el-button @click="cancel" class="mr10">返回</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="ReceiptOrderEdit">
import {
  computed,
  getCurrentInstance,
  onMounted,
  reactive,
  ref,
  toRefs,
} from "vue";
import { updateOrder, getOrder } from "@/api/wms/order";
import { delShipmentNotice } from "@/api/wms/shipmentNotice";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { useWmsStore } from "@/store/modules/wms";
import useUserStore from "@/store/modules/user";

const { userOptions, logisticsList } = useWmsStore();
const { proxy } = getCurrentInstance();
const router = useRouter();
const { order_option, order_type, order_status, shipping_notice_status } =
  proxy.useDict(
    "order_option",
    "order_type",
    "order_status",
    "shipping_notice_status"
  );
const userStore = useUserStore();
const mode = ref(false);
const loading = ref(false);
const form = ref({
  id: undefined,
  userId: undefined,
  type: "",
  remark: undefined,
  status: "",
  totalAmount: "",
  merchandises: [],
});

const cancel = () => {
  // await proxy?.$modal.confirm("确认取消编辑订单吗？");
  close();
};
const close = (path = "/order") => {
  const obj = { path: path };
  proxy?.$tab.closeOpenPage(obj);
};

const showAddItem = () => {
  proxy.$router.push({
    path: "/shipmentNotice/create",
    query: { orderId: form.value.id },
  });
};

const orderForm = ref();

const doSave = async () => {
  orderForm.value?.validate((valid) => {
    const params = {
      id: form.value.id,
      userId: userStore.id,
      type: form.value.type,
      remark: form.value.remark,
      status: form.value.status,
      totalAmount: form.value.totalAmount,
    };
    updateOrder(params).then((res) => {
      if (res.code === 200) {
        ElMessage.success(res.msg);
        close();
      } else {
        ElMessage.error(res.msg);
      }
    });
  });
};

const saveOrder = async () => {
  await proxy?.$modal.confirm("确认保存更改吗？");
  doSave(2);
};

const route = useRoute();
onMounted(() => {
  const id = route.query && route.query.id;
  loadDetail(id);
});

// 获取订单详情
const loadDetail = (id) => {
  loading.value = true;
  getOrder(id)
    .then((response) => {
      form.value = { ...response.data };
      form.value.merchandises.forEach((it) => {
        it.labelOption = it.labelOption.split(",");
        it.totalQuantityNotice = it.totalQuantityNotice || 0;
      });
      form.value.user = userOptions.find(
        (i) => i.value.toString() === form.value.userId
      )?.label;
      Promise.resolve();
    })
    .then(() => {})
    .finally(() => {
      loading.value = false;
    });
};

const disableCreate = computed(() => {
  return form.value.merchandises.every(
    (it) => it.totalQuantityNotice === it.quantityRequired
  );
});
/** 查看按钮操作 */
function handleViewDetail(row) {
  proxy.$router.push({ path: "/shipmentNotice/detail", query: { id: row.id } });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal
    .confirm('是否确认删除发货通知单编号为"' + _ids + '"的数据项？')
    .then(function () {
      loading.value = true;
      return delShipmentNotice(_ids);
    })
    .then(() => {
      loading.value = true;
      loadDetail(route.query.id);
      proxy.$modal.msgSuccess("删除成功");
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false;
    });
}
function handleAdd(row) {
  proxy.$router.push({
    path: "/shipment/create",
    query: { shipmentId: row.id },
  });
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.module";

.btn-box {
  width: calc(100% - #{$base-sidebar-width});
  display: flex;
  align-items: center;
  justify-content: space-between;
  float: right;
}
.goods-info {
  display: flex;
  align-items: center;
  padding: 5px;
  justify-content: space-between;
  &:not(:last-child) {
    border-bottom: 1px solid #eaeaea;
  }

  .goods-image {
    width: 80px;
    height: 80px;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .goods-info-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    &:not(:last-child) {
      margin: 0 20px;
    }
  }
}
</style>
