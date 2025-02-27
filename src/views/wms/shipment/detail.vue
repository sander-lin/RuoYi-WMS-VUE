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
      <el-card header="物流详情" class="mt10">
        <el-button
          type="primary"
          plain
          class="pull-right"
          @click="showAddLogistics"
        >
          新增物流信息
        </el-button>
        <el-timeline class="time-line">
          <el-timeline-item
            v-for="(activity, index) in activities"
            :key="index"
            :timestamp="dayjs(activity.logisticsDate).format('YYYY-MM-DD HH:mm:ss')"
            @mouseenter="() => editLogisticsId = activity.id"
            @mouseleave="editLogisticsId = ''"
          >
            <div v-show="editLogisticsId !== activity.id">
            {{ activity.logisticsInfo }}
          </div>
          <div v-show="editLogisticsId === activity.id">
            <el-button link type="primary" @click="handleChangeLogistics(activity)">
              修改
            </el-button>
            <el-button link type="primary" @click="handleDeleteLogistics(activity)">
              删除
            </el-button>
          </div>
          </el-timeline-item>
        </el-timeline>
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
          <el-button @click="close()" type="primary" class="mr10"
            >返回</el-button
          >
        </div>
      </div>
    </div>
  </div>
  <el-dialog
    v-model="logisticVisible"
    :title="logisticsTitle"
    align-center
    width="500"
  >
    <el-form
      ref="logisticsFormRef"
      style="max-width: 600px"
      :model="logisticsForm"
      :rules="rules"
    >
      <el-form-item label="物流信息" prop="logisticsInfo">
        <el-input v-model="logisticsForm.logisticsInfo" type="textarea" />
      </el-form-item>
      <el-form-item label="物流时间" prop="logisticsDate">
        <el-date-picker
          v-model="logisticsForm.logisticsDate"
          type="datetime"
          placeholder="选择时间"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm(logisticsFormRef)">
          确定
        </el-button>
        <el-button @click="resetForm(logisticsFormRef)">取消</el-button>
      </div>
    </template>
  </el-dialog>
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
import {
  listLogistics,
  addLogistics,
  updateLogistics,
  delLogistics,
} from "@/api/wms/logistics";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { useWmsStore } from "@/store/modules/wms";
import useUserStore from "@/store/modules/user";
import mapData from "../../../utils/mapData";
import dayjs from "dayjs";

const { proxy } = getCurrentInstance();
const { label_type, order_option, shipping_status, noticeStatusMap } = mapData;
const { logisticsList } = useWmsStore();
const userStore = useUserStore();
const isBuyer = userStore.roles.includes("buyer");
const editLogisticsId = ref('')
const logisticsTitle = ref('增加最新物流信息')
const isAddLogistics = ref(true)

const editAble = computed(() => {
  return !isBuyer && form.value.status !== noticeStatusMap.value.yi_wan_cheng;
});
const receiptAble = computed(() => {
  return isBuyer && form.value.status === noticeStatusMap.value.quan_bu_fa_huo;
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
const logisticVisible = ref(false);
const activities = ref([]);

const logisticsFormRef = ref();
const logisticsForm = reactive({
  id: undefined,
  logisticsInfo: undefined,
  logisticsDate: undefined,
});

const rules = reactive({
  logisticsInfo: [
    { required: true, message: "请输入物流信息", trigger: "blur" },
  ],
  logisticsDate: [
    { required: true, message: "请输入物流日期", trigger: "blur" },
  ],
});

const getLogistics = (id) => {
  listLogistics(id).then((response) => {
    activities.value = response.rows;
  });
};

const submitForm = async (formEl) => {
  if (!formEl) {
    logisticVisible.value = false;
    return;
  }
  await formEl.validate((valid, fields) => {
    if (valid) {
      if(isAddLogistics.value) {
        addLogistics({
        shipmentId: route.query.id,
        logisticsInfo: logisticsForm.logisticsInfo,
        logisticsDate: logisticsForm.logisticsDate,
      }).then((response) => {
        if (response.code === 200) {
          ElMessage({
            type: "success",
            message: "添加成功",
          });
          activities.value.push({
            logisticsInfo: logisticsForm.logisticsInfo,
            logisticsDate: logisticsForm.logisticsDate,
          });
        }
      }).finally(() => {
        logisticVisible.value = false;
      });
      }
      else {
        updateLogistics({
          id: logisticsForm.id,
          logisticsInfo: logisticsForm.logisticsInfo,
          logisticsDate: logisticsForm.logisticsDate,
        }).then((response) => {
          if (response.code === 200) {
            ElMessage({
              type: "success",
              message: "修改成功",
            });
            activities.value = activities.value.map((item) => {
              if (item.id === logisticsForm.id) {
                return {
                  id: logisticsForm.id,
                  logisticsInfo: logisticsForm.logisticsInfo,
                  logisticsDate: logisticsForm.logisticsDate,
                };
              }
              return item;
            });
          }
        }).finally(() => {
          logisticVisible.value = false;
        });
      }
    }
  });
};

const resetForm = (formEl) => {
  if (!formEl) {
    logisticVisible.value = false;
    return;
  }
  formEl.resetFields();
  logisticVisible.value = false;
};

const showAddLogistics = () => {
  logisticVisible.value = true;
  isAddLogistics.value = true;
  logisticsTitle.value = "新增物流信息"
  nextTick(() => {
    logisticsFormRef.value.resetFields();
  });
};

const handleChangeLogistics = (logistics) => {
  isAddLogistics.value = false
  logisticVisible.value = true;
  logisticsTitle.value = "修改物流信息"

  nextTick(()=>{
    logisticsFormRef.value.resetFields();
    logisticsForm.id = logistics.id;
    logisticsForm.logisticsInfo = logistics.logisticsInfo;
    logisticsForm.logisticsDate = logistics.logisticsDate;
  })
}

const handleDeleteLogistics = (logistics) => {
  delLogistics([logistics.id]).then((response) => {
    if (response.code === 200) {
      ElMessage({
        type: "success",
        message: "删除成功",
      });
      activities.value = activities.value.filter((item) => item.id !== logistics.id);
    }
  });
}

const data = reactive({
  form: { ...initFormData },
});
const { form } = toRefs(data);

const save = (status) => {
  ElMessageBox.confirm(
    status === noticeStatusMap.value.quan_bu_fa_huo ? "确认收货吗？" : "确定保存吗？"
  )
    .then(() => {
      loading.value = true;
      const data = {
        id: form.value.id,
        status:
          status === noticeStatusMap.value.quan_bu_fa_huo
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
              status === noticeStatusMap.value.quan_bu_fa_huo
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
  getLogistics(id)
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
.time-line {
  padding-top: 32px;
  padding-bottom: 32px;
}
</style>
