<template>
  <div>
    <div
      class="receipt-order-edit-wrapper app-container"
      style="margin-bottom: 60px"
      v-loading="loading"
    >
      <el-card header="选择发货商品" class="mt10">
        <el-form
          label-width="108px"
          :model="form"
          ref="orderForm"
          :rules="rules"
        >
          <div class="receipt-order-content">
            <el-table
              :data="form.merchandises"
              ref="multipleTable"
              border
              empty-text="暂无商品"
              :row-key="getRowKey"
              @selection-change="handleSelectionChange"
            >
              <el-table-column
                type="selection"
                width="55"
                :reserve-selection="true"
              />
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
                  <el-select
                    v-model="row.labelOption"
                    placeholder="请选择"
                    multiple
                    disabled
                  >
                    <el-option
                      v-for="item in order_option"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    ></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column
                label="通知发货数量"
                prop="quantityNotice"
                width="120"
                align="center"
              />
              <el-table-column
                label="库存数量"
                prop="inventoryQuantity"
                width="120"
                align="center"
              />
              <el-table-column
                label="总已发数量"
                prop="totalQuantityShipped"
                width="120"
                align="center"
              />
              <el-table-column
                label="本次实发数量"
                prop="quantityShipped"
                width="200"
                align="center"
              >
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.quantityShipped"
                    placeholder="数量"
                    :min="1"
                    :max="row.quantityNotice - row.totalQuantityShipped"
                    :precision="0"
                    @change="handleChangeQuantity(row)"
                    @blur="handleChangeQuantity(row)"
                  ></el-input-number>
                </template>
              </el-table-column>
              <!-- <el-table-column label="操作" align="center" fixed="right">
                  <template #default="scope">
                    <el-button
                      icon="Delete"
                      type="danger"
                      plain
                      size="small"
                      @click="handleDeleteDetail(scope.row, scope.$index)"
                      link
                      >删除</el-button
                    >
                  </template>
                </el-table-column> -->
            </el-table>
          </div>
        </el-form>
      </el-card>
      <el-card header="其他信息" class="mt20">
        <el-form :model="form" ref="orderForm" label-width="120px">
          <div style="display: flex">
            <el-form-item
              label="希望配送方式"
              prop="deliveryMethod"
              style="margin-right: 50px"
            >
              <el-select v-model="form.deliveryMethod" placeholder="请选择">
                <el-option
                  v-for="item in logisticsList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="标签种类" prop="tag">
              <el-select v-model="form.tag" placeholder="请选择">
                <el-option
                  v-for="item in label_type"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="备注" prop="remark">
            <el-input
              type="textarea"
              v-model="form.remark"
              :autosize="{ minRows: 5, maxRows: 10 }"
              placeholder="请输入备注"
            ></el-input>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <div class="footer-global">
      <div class="btn-box">
        <div></div>
        <div>
          <el-button @click="AddShipment" type="primary">发布</el-button>
          <el-button @click="cancel" class="mr10">取消</el-button>
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
  toRef,
  toRefs,
  watch,
} from "vue";
import { addShipment, updateShipment } from "@/api/wms/shipment";
import { getShipmentNotice } from "@/api/wms/shipmentNotice";
import { ElMessage } from "element-plus";
import { useRoute } from "vue-router";
import { useWmsStore } from "@/store/modules/wms";
import useUserStore from "@/store/modules/user";
import { generateNo } from "@/utils/ruoyi";
import mapData from "../../../utils/mapData";

const { proxy } = getCurrentInstance();

const { label_type, order_option } = mapData;
const { logisticsList } = useWmsStore();

const userStore = useUserStore();
const loading = ref(false);
const selectItemSkuVoCheck = ref([]);
const initFormData = {
  id: undefined,
  userId: undefined,
  remark: undefined,
  status: "",
  tag: "",
  deliveryMethod: "",
  merchandises: [],
};
const data = reactive({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
  },
  rules: {
    tag: [{ required: true, message: "标签种类不能为空", trigger: "blur" }],
    deliveryMethod: [
      { required: true, message: "配送方式不能为空", trigger: "blur" },
    ],
  },
});
const { form, rules } = toRefs(data);

const cancel = async () => {
  await proxy?.$modal.confirm("确认取消编辑发货单吗？");
  close();
};
const close = () => {
  proxy.$router.go(-1);
  proxy?.$tab.closePage();
};

const getRowKey = (row) => {
  return row.id;
};
// 初始化receipt-order-form ref
const orderForm = ref();
const multipleTable = ref();
const doSave = async (NoticeStatus = 1) => {
  //验证receiptForm表单
  orderForm.value?.validate((valid) => {
    // 校验
    if (!valid) {
      return ElMessage.error("请填写必填项");
    }
    if (selectItemSkuVoCheck.value?.length) {
      const invalidQuantityList = selectItemSkuVoCheck.value.filter(
        (it) => !it.quantityShipped || it.quantityShipped < 1
      );
      if (invalidQuantityList?.length) {
        return ElMessage.error("发货数量最小为1");
      }
    } else {
      return ElMessage.error("请选择商品");
    }
    // 构建参数
    const merchandises = selectItemSkuVoCheck.value.map((it) => {
      return {
        merchandiseId: it.id,
        quantityShipped: it.quantityShipped,
      };
    });
    const params = {
      orderId: form.value.orderId,
      shipmentNoticeId: form.value.id,
      userId: userStore.id,
      remark: form.value.remark,
      status: NoticeStatus,
      tag: form.value.tag,
      deliveryMethod: form.value.deliveryMethod,
      merchandises: merchandises,
    };
    if (params.id) {
      updateShipment(params).then((res) => {
        if (res.code === 200) {
          ElMessage.success(res.msg);
          NoticeStatus === 1 ? close("/order/draft") : proxy.$router.go(-1);
        } else {
          ElMessage.error(res.msg);
        }
      });
    } else {
      addShipment(params).then((res) => {
        if (res.code === 200) {
          ElMessage.success(res.msg);
          NoticeStatus === 1 ? close("/order/draft") : proxy.$router.go(-1);
        } else {
          ElMessage.error(res.msg);
        }
      });
    }
  });
};

const AddShipment = async () => {
  await proxy?.$modal.confirm("确认发布吗？");
  doSave(1);
};

const route = useRoute();
onMounted(() => {
  const id = route.query && route.query.shipmentId;
  if (id) {
    loadDetail(id);
  } else {
    form.value.receiptOrderNo = "RK" + generateNo();
  }
});

// 获取商品信息
const loadDetail = (id) => {
  loading.value = true;
  getShipmentNotice(id)
    .then((response) => {
      form.value = response.data;
      form.value.remark = "";
      form.value.merchandises.forEach((it) => {
        it.labelOption = it.labelOption.split(",");
        it.totalQuantityShipped = it.totalQuantityShipped || 0;
      });
      Promise.resolve();
    })
    .then(() => {})
    .finally(() => {
      loading.value = false;
    });
};

const handleChangeQuantity = (row) => {
  if (row.quantityShipped > 0) {
    multipleTable.value.toggleRowSelection(row, true);
  } else {
    multipleTable.value.clearSelection();
  }
};

/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  selectItemSkuVoCheck.value = selection;
};

// const handleDeleteDetail = (row, index) => {
//   form.value.merchandises.splice(index, 1);
// };

/** 删除按钮操作 */
function updateOrderMerchandises(row, index) {
  const _ids = row.id || ids.value;
  proxy.$modal
    .confirm('是否确认删除订单表编号为"' + _ids + '"的数据项？')
    .then(function () {
      loading.value = true;
      return delOrder(_ids);
    })
    .then(() => {
      loading.value = true;
      getList();
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
</style>
