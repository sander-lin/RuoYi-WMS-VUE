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
            <el-form-item label="发货单号：" prop="id">
              {{ form.id }}
            </el-form-item>
            <el-form-item label="状态：" prop="status">
              <!-- <el-select
                v-model="form.status"
                @change="handleChangeStatus(scope.row)"
                v-if="editAble"
              >
                <el-option
                  v-for="item in shipping_status.filter(
                    (i) => i.value !== noticeStatusMap.yi_wan_cheng
                  )"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select> -->
              <div
                style="font-weight: bold; font-size: large"
                :style="{ color: form.status === '4' ? 'green' : 'grey' }"
              >
                {{
                  shipping_status?.find((i) => i.value === form.status)?.label
                }}
              </div>
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
                  {{ order_option?.find((i) => i.value === item)?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="通知发货数量"
              prop="quantityNotice"
              width="120"
            />
            <el-table-column
              label="本次实发数量"
              prop="quantityShipped"
              width="120"
            />
          </el-table>
        </div>
      </el-card>
    </div>
    <div class="footer-global">
      <div class="btn-box">
        <div></div>
        <div>
          <!-- <el-button
            @click="save(noticeStatusMap.yi_wan_cheng)"
            type="primary"
            v-if="receiptAble"
            >确认收货</el-button
          >
          <el-button @click="save()" type="primary" v-if="editAble"
            >保存</el-button
          > -->
          <el-button @click="close()" class="mr10">返回</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="ShipmentEdit">
import {
  computed,
  getCurrentInstance,
  onMounted,
  reactive,
  ref,
  toRefs,
} from "vue";
import { getShipment, updateShipment } from "@/api/wms/shipment";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { useWmsStore } from "@/store/modules/wms";
import useUserStore from "@/store/modules/user";
import mapData from "../../../utils/mapData";

const { proxy } = getCurrentInstance();
const { label_type, order_option, shipping_status, noticeStatusMap } = mapData;
const { logisticsList } = useWmsStore();
const userStore = useUserStore();
const isBuyer = userStore.roles.includes("buyer");
const editAble = computed(() => {
  return !isBuyer && form.value.status !== noticeStatusMap.yi_wan_cheng;
});
const receiptAble = computed(() => {
  return isBuyer && form.value.status === noticeStatusMap.quan_bu_fa_huo;
});
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
});
const { form } = toRefs(data);

const save = (status) => {
  ElMessageBox.confirm(
    status === noticeStatusMap.quan_bu_fa_huo ? "确认收货吗？" : "确定保存吗？"
  )
    .then(() => {
      loading.value = true;
      const data = {
        id: form.value.id,
        status:
          status === noticeStatusMap.quan_bu_fa_huo
            ? status
            : form.value.status,
        deliveryMethod: form.value.deliveryMethod,
        shipmentNoticeId: route.query.id,
      };
      updateShipment(data).then((response) => {
        if (response.code === 200) {
          ElMessage({
            type: "success",
            message:
              status === noticeStatusMap.quan_bu_fa_huo
                ? "确认收货成功"
                : "修改成功",
          });
        }
      });
      loading.value = false;
      close();
    })
    .catch(() => {
      loading.value = false;
    });
};

const close = () => {
  proxy?.$router.go(-1);
  proxy.$tab.closePage();
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
  getShipment(id)
    .then((response) => {
      form.value = { ...response.data };
      form.value.merchandises.forEach((it) => {
        it.labelOption = it.labelOption.split(",");
      });
      Promise.resolve();
    })
    .then(() => {})
    .finally(() => {
      loading.value = false;
    });
};
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
