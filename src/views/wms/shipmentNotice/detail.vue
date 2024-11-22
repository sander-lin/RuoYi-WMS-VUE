<template>
  <div>
    <div
      class="receipt-order-edit-wrapper app-container"
      style="margin-bottom: 60px"
      v-loading="loading"
    >
      <el-card>
        <el-form :model="form" ref="orderForm" label-width="120px">
          <div style="display: flex">
            <el-form-item label="发货通知单号：" prop="id">
              {{ form.id }}
            </el-form-item>
            <el-form-item label="状态：" prop="status">
              <el-select
                v-model="form.status"
                @change="handleChangeStatus(scope.row)"
                disabled
              >
                <el-option
                  v-for="item in shipping_notice_status"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="配送信息：" prop="order">
            <el-descriptions border>
              <el-descriptions-item label="希望配送方法">
                {{
                  logisticsList.find((item) => item.id === form.deliveryMethod)
                    ?.name
                }}
              </el-descriptions-item>
              <el-descriptions-item label="标签种类">
                <dict-tag :options="label_type" :value="form.tag" />
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{
                form.createTime
              }}</el-descriptions-item>
              <el-descriptions-item label="备注">{{
                form.remark
              }}</el-descriptions-item>
            </el-descriptions>
          </el-form-item>
        </el-form>
      </el-card>
      <el-card header="商品明细" class="mt10">
        <div class="receipt-order-content">
          <el-table :data="form.merchandises" border empty-text="暂无商品明细">
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
                  {{ order_option.find((i) => i.value === item)?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="通知发货数量"
              prop="quantityNotice"
              width="120"
            />
            <el-table-column
              label="已通知发货数量"
              prop="totalQuantityNotice"
              width="120"
            />
          </el-table>
        </div>
      </el-card>
      <el-card class="mt10">
        <template #header>
          <div class="flex-space-between mb8">
            <div>发货信息</div>
            <el-button
              type="primary"
              plain="plain"
              size="default"
              @click="showAddItem"
              icon="Plus"
              >创建发货单</el-button
            >
          </div>
        </template>
        <!-- <el-tabs
            v-model="queryParams.status"
            @tab-click="handleQuery"
            type="card"
            v-if="!isDraft"
            >
            <el-tab-pane name="" label="全部" />
            <el-tab-pane
                :name="item.value"
                v-for="item in order_status"
                :key="item.value"
                :label="item.label"
            />
            </el-tabs> -->
        <div class="receipt-order-content">
          <el-table :data="form.shipments" border empty-text="暂无发货单">
            <el-table-column label="发货单号" prop="id" v-if="true" />
            <el-table-column
              label="创建时间"
              prop="createTime"
              align="center"
              width="200"
            />
            <el-table-column
              label="物流渠道"
              prop="deliveryMethod"
              align="center"
              width="200"
            />
            <el-table-column
              label="状态"
              prop="status"
              align="center"
              width="200"
            >
              <template #default="{ row }">
                <dict-tag :options="shipping_status" :value="row.status" />
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              align="center"
              class-name="small-padding fixed-width"
            >
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  icon="View"
                  @click="handleViewDetail(scope.row)"
                  v-hasPermi="['wms:shipment:query']"
                  >查看详情</el-button
                >
                <el-button
                  link
                  type="primary"
                  icon="Delete"
                  @click="handleDelete(scope.row)"
                  v-hasPermi="['wms:shipment:remove']"
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
          <!-- <el-button @click="AddNotice" type="primary">保存</el-button> -->
          <el-button @click="cancel" class="mr10">返回</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="ShipmentNoticeEdit">
import {
  computed,
  getCurrentInstance,
  onMounted,
  reactive,
  ref,
  toRef,
  toRefs,
  watch,
} from "vue";
import {
  addShipmentNotice,
  updateShipmentNotice,
  getShipmentNotice,
} from "@/api/wms/shipmentNotice";
import { delShipment } from "@/api/wms/shipment";
import { ElMessage, ElMessageBox } from "element-plus";
import SkuSelect from "@/views/components/SkuSelect.vue";
import { useRoute, useRouter } from "vue-router";
import { useWmsStore } from "@/store/modules/wms";
import useUserStore from "@/store/modules/user";
import { numSub, generateNo } from "@/utils/ruoyi";

const { proxy } = getCurrentInstance();
const router = useRouter();
const { logisticsList } = useWmsStore();
const { label_type, order_option, shipping_status, shipping_notice_status } =
  proxy.useDict(
    "label_type",
    "order_option",
    "shipping_status",
    "shipping_notice_status"
  );
const currentPath = computed(() => {
  return router.currentRoute.value.path;
});
const userStore = useUserStore();
const mode = ref(false);
const loading = ref(false);
const initFormData = {
  id: undefined,
  userId: undefined,
  type: "",
  remark: undefined,
  status: "",
  totalAmount: "",
  merchandises: [],
};
const data = reactive({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderNo: undefined,
  },
  rules: {
    id: [{ required: true, message: "不能为空", trigger: "blur" }],
  },
});
const { form, rules } = toRefs(data);

const cancel = () => {
  // await proxy?.$modal.confirm("确认取消编辑发货通知单吗？");
  close();
};
const close = (path = "/shipmentNotice") => {
  const obj = { path: path };
  proxy?.$tab.closeOpenPage(obj);
};
const skuSelectShow = ref(false);

const showAddItem = () => {
  proxy.$router.push({
    path: "/shipment/create",
    query: { shipmentId: form.value.id },
  });
};

const handleOkClick = (item) => {
  skuSelectShow.value = false;
  item.forEach((it) => {
    form.value.merchandises.push({
      ...it,
      merchandiseId: it.id,
      quantityRequired: null,
      labelOption: null,
    });
  });
};

/** 查看详情按钮操作 */
function handleViewDetail(row) {
  proxy.$router.push({ path: "/shipment/detail", query: { id: row.id } });
}

const orderForm = ref();

const route = useRoute();
onMounted(() => {
  const id = route.query && route.query.id;
  loadDetail(id);
});

// 获取发货通知单详情
const loadDetail = (id) => {
  loading.value = true;
  getShipmentNotice(id)
    .then((response) => {
      form.value = { ...response.data };
      form.value.merchandises?.forEach((it) => {
        it.labelOption = it.labelOption.split(",");
      });
      form.value.shipments?.forEach((it) => {
        it.deliveryMethod = logisticsList.find(
          (item) => item.id === it.deliveryMethod
        ).name;
      });
      Promise.resolve();
    })
    .then(() => {})
    .finally(() => {
      loading.value = false;
    });
};

const handleChangeQuantity = () => {
  let sum = 0;
  form.value.merchandises.forEach((it) => {
    if (it.quantityRequired) {
      sum += Number(it.quantityRequired);
    }
  });
  form.value.totalQuantity = sum;
};

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal
    .confirm('是否确认删除发货单表编号为"' + _ids + '"的数据项？')
    .then(function () {
      loading.value = true;
      return delShipment(_ids);
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
