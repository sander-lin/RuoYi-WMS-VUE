<template>
  <div>
    <div
      class="receipt-order-edit-wrapper app-container"
      style="margin-bottom: 60px"
      v-loading="loading"
    >
      <el-card header="商品明细" class="mt10">
        <el-form
          label-width="108px"
          :model="form"
          ref="receiptForm"
          :rules="rules"
        >
          <div class="receipt-order-content">
            <div class="flex-space-between mb8">
              <div></div>
              <el-button
                type="primary"
                plain="plain"
                size="default"
                @click="showAddItem"
                icon="Plus"
                >添加商品</el-button
              >
            </div>
            <el-table :data="form.inventories" border empty-text="暂无商品明细">
              <el-table-column label="商品信息" prop="itemSku.name" width="250">
                <template #default="{ row }">
                  <div>商品名称：{{ row.itemSku.name }}</div>
                  <div v-if="row.itemSku.type">
                    型号：{{ row.itemSku.type }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="规格信息" width="150">
                <template #default="{ row }">
                  <div>颜色：{{ row.itemSku.color }}</div>
                  <div>尺寸：{{ row.itemSku.size }}</div>
                </template>
              </el-table-column>
              <el-table-column label="数量" prop="number" width="200">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.number"
                    placeholder="数量"
                    :min="1"
                    :precision="0"
                    @change="handleChangeQuantity"
                  ></el-input-number>
                </template>
              </el-table-column>
              <el-table-column label="单位" prop="unit" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.unit" placeholder="请输入单位" />
                </template>
              </el-table-column>
              <!-- <el-table-column label="备注" prop="remark">
              <template #default="{ row }">
                <el-input
                  type="textarea"
                  v-model="row.remark"
                  placeholder="请输入备注"
                  clearable
                />
              </template>
            </el-table-column> -->

              <el-table-column label="操作" align="center" fixed="right">
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
              </el-table-column>
            </el-table>
          </div>
        </el-form>
      </el-card>
      <SkuSelect
        ref="sku-select"
        :model-value="skuSelectShow"
        @handleOkClick="handleOkClick"
        @handleCancelClick="skuSelectShow = false"
        :size="'80%'"
      />
    </div>
    <div class="footer-global">
      <div class="btn-box">
        <div>
          <!-- <el-button @click="doWarehousing" type="primary" class="ml10"
            >完成入库</el-button
          >
          <el-button @click="updateToInvalid" type="danger" v-if="form.id"
            >作废</el-button
          > -->
        </div>
        <div>
          <el-button @click="doWarehousing" type="primary">完成入库</el-button>
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
import {
  addReceiptOrder,
  getReceiptOrder,
  updateReceiptOrder,
  warehousing,
} from "@/api/wms/receiptOrder";
import {
  listInventories,
  getInventories,
  delInventories,
  addInventories,
  updateInventories,
  batchAddInventories,
} from "@/api/wms/Inventories";
import { ElMessage, ElMessageBox } from "element-plus";
import SkuSelect from "../../../components/SkuSelect.vue";
import { useRoute } from "vue-router";
import { useWmsStore } from "@/store/modules/wms";
import { numSub, generateNo } from "@/utils/ruoyi";
import { delReceiptOrderDetail } from "@/api/wms/receiptOrderDetail";

const { proxy } = getCurrentInstance();
const { wms_receipt_type } = proxy.useDict("wms_receipt_type");
const mode = ref(false);
const loading = ref(false);
const initFormData = {
  id: undefined,
  receiptOrderNo: undefined,
  receiptOrderType: "2",
  merchantId: undefined,
  orderNo: undefined,
  payableAmount: undefined,
  receiptOrderStatus: 0,
  remark: undefined,
  warehouseId: "1828364740028174337",
  areaId: "1829397566185992193",
  totalQuantity: 0,
  inventories: [],
};
const data = reactive({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    receiptOrderNo: undefined,
    receiptOrderType: undefined,
    orderNo: undefined,
    payableAmount: undefined,
    receiptOrderStatus: undefined,
  },
  rules: {
    id: [{ required: true, message: "不能为空", trigger: "blur" }],
    receiptOrderNo: [
      { required: true, message: "入库单号不能为空", trigger: "blur" },
    ],
    // receiptOrderType: [
    //   { required: true, message: "入库类型不能为空", trigger: "change" },
    // ],
    receiptOrderStatus: [
      { required: true, message: "入库状态不能为空", trigger: "change" },
    ],
    warehouseId: [
      { required: true, message: "请选择仓库", trigger: ["blur", "change"] },
    ],
  },
});
const { form, rules } = toRefs(data);

const cancel = async () => {
  await proxy?.$modal.confirm("确认取消编辑入库单吗？");
  close();
};
const close = () => {
  const obj = { path: "/inventories" };
  proxy?.$tab.closeOpenPage(obj);
};
const skuSelectShow = ref(false);

// 选择商品 start
const showAddItem = () => {
  skuSelectShow.value = true;
};
// 选择成功
const handleOkClick = (item) => {
  skuSelectShow.value = false;
  item.forEach((it) => {
    form.value.inventories.push({
      itemSku: { ...it },
      merchandiseId: it.id,
      number: null,
      unit: null,
      remark: null,
    });
  });
};
// 选择商品 end

// 初始化receipt-order-form ref
const receiptForm = ref();

const save = async () => {
  await proxy?.$modal.confirm("确认暂存入库单吗？");
  doSave();
};

const doSave = async (receiptOrderStatus = 0) => {
  //验证receiptForm表单
  receiptForm.value?.validate((valid) => {
    // 校验
    if (!valid) {
      return ElMessage.error("请填写必填项");
    }
    if (form.value.inventories?.length) {
      const invalidQuantityList = form.value.inventories.filter(
        (it) => !it.number
      );
      if (invalidQuantityList?.length) {
        return ElMessage.error("请选择数量");
      }
    }
    // 构建参数
    const inventories = form.value.inventories.map((it) => {
      return {
        merchandiseId: it.merchandiseId,
        number: it.number,
        unit: it.unit,
        remark: `入库${it.number}${it.unit}`,
      };
    });

    // console.log("提交前校验", form.value);
    const params = {
      id: form.value.id,
      receiptOrderNo: form.value.receiptOrderNo,
      receiptOrderStatus,
      receiptOrderType: form.value.receiptOrderType,
      merchantId: form.value.merchantId,
      orderNo: form.value.orderNo,
      remark: form.value.remark,
      payableAmount: form.value.payableAmount,
      totalQuantity: form.value.totalQuantity,
      warehouseId: form.value.warehouseId,
      areaId: form.value.areaId,
      inventories: inventories,
    };
    if (params.id) {
      updateReceiptOrder(params).then((res) => {
        if (res.code === 200) {
          ElMessage.success(res.msg);
          close();
        } else {
          ElMessage.error(res.msg);
        }
      });
    } else {
      addReceiptOrder(params).then((res) => {
        if (res.code === 200) {
          ElMessage.success(res.msg);
          close();
        } else {
          ElMessage.error(res.msg);
        }
      });
    }
  });
};

const updateToInvalid = async () => {
  await proxy?.$modal.confirm("确认作废入库单吗？");
  doSave(-1);
};

const doWarehousing = async () => {
  await proxy?.$modal.confirm("确认入库吗？");
  receiptForm.value?.validate((valid) => {
    // 校验
    if (!valid) {
      return ElMessage.error("请填写必填项");
    }
    if (!form.value.inventories?.length) {
      return ElMessage.error("请选择商品");
    }
    const invalidQuantityList = form.value.inventories.filter(
      (it) => !it.number
    );
    if (invalidQuantityList?.length) {
      return ElMessage.error("请选择数量");
    }
    // 构建参数
    const inventories = form.value.inventories.map((it) => {
      return {
        merchandiseId: it.merchandiseId,
        number: it.number,
        unit: it.unit,
        remark: `入库${it.number}${it.unit}`,
      };
    });

    //console.log('提交前校验',form.value)
    const params = {
      inventories: inventories,
    };
    batchAddInventories(params).then((res) => {
      if (res.code === 200) {
        ElMessage.success("入库成功");
        close();
      } else {
        ElMessage.error(res.msg);
      }
    });
  });
};

const route = useRoute();
onMounted(() => {
  const id = route.query && route.query.id;
  if (id) {
    loadDetail(id);
  } else {
    form.value.receiptOrderNo = "RK" + generateNo();
  }
});

// 获取入库单详情
const loadDetail = (id) => {
  loading.value = true;
  getReceiptOrder(id)
    .then((response) => {
      form.value = { ...response.data };
      Promise.resolve();
    })
    .then(() => {})
    .finally(() => {
      loading.value = false;
    });
};

const handleChangeWarehouse = (e) => {
  form.value.areaId = undefined;
  form.value.inventories.forEach((it) => {
    it.areaId = undefined;
  });
};

const handleChangeArea = (e) => {
  form.value.inventories.forEach((it) => {
    it.areaId = e;
  });
};

const handleChangeQuantity = () => {
  let sum = 0;
  form.value.inventories.forEach((it) => {
    if (it.quantity) {
      sum += Number(it.quantity);
    }
  });
  form.value.totalQuantity = sum;
};

const handleAutoCalc = () => {
  let sum = undefined;
  form.value.inventories.forEach((it) => {
    if (it.amount >= 0) {
      if (!sum) {
        sum = 0;
      }
      sum = numSub(sum, -Number(it.amount));
    }
  });
  form.value.payableAmount = sum;
};

const handleDeleteDetail = (row, index) => {
  if (row.id) {
    proxy.$modal
      .confirm("确认删除本条商品明细吗？如确认会立即执行！")
      .then(function () {
        return delReceiptOrderDetail(row.id);
      })
      .then(() => {
        form.value.inventories.splice(index, 1);
        proxy.$modal.msgSuccess("删除成功");
      });
  } else {
    form.value.inventories.splice(index, 1);
  }
};
const goSaasTip = () => {
  ElMessageBox.alert("一物一码/SN模式请去Saas版本体验！", "系统提示", {
    confirmButtonText: "确定",
  });
  return false;
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
</style>
