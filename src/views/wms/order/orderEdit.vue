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
          ref="orderForm"
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
                  <el-select
                    v-model="row.labelOption"
                    placeholder="请选择"
                    multiple
                    :disabled="!currentPath.includes('orderEdit')"
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
              <el-table-column label="数量" prop="quantityRequired" width="200">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.quantityRequired"
                    placeholder="数量"
                    :min="1"
                    :precision="0"
                    @change="handleChangeQuantity"
                  ></el-input-number>
                </template>
              </el-table-column>
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
      <el-card header="其他信息" class="mt20">
        <el-form :model="form" ref="orderForm" label-width="68px">
          <el-form-item label="订单类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择">
              <el-option
                v-for="item in order_type"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
          </el-form-item>
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
      <div class="total-price">
        <span class="total-price-label">订单总价：￥</span>
        <span class="total-price-number">
          {{ totalPrice ? totalPrice : "--" }}
        </span>
      </div>
      <SkuSelect
        ref="sku-select"
        :model-value="skuSelectShow"
        :selected-item="form.merchandises.map((it) => it.id)"
        @handleOkClick="handleOkClick"
        @handleCancelClick="skuSelectShow = false"
        :size="'80%'"
      />
    </div>
    <div class="footer-global">
      <div class="btn-box">
        <div></div>
        <div>
          <el-button @click="AddOrder" type="primary">发布</el-button>
          <el-button @click="saveAsDraft" type="primary">保存为草稿</el-button>
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
  addOrder,
  updateOrder,
  getOrder,
  createDraftOrder,
} from "@/api/wms/order";
import { ElMessage } from "element-plus";
import SkuSelect from "@/views/components/SkuSelect.vue";
import { useRoute, useRouter } from "vue-router";
import useUserStore from "@/store/modules/user";
import { generateNo } from "@/utils/ruoyi";
import mapData from "../../../utils/mapData";

const { order_type, order_option, orderStatusMap } = mapData;

const { proxy } = getCurrentInstance();
const router = useRouter();

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
  totalAmount: "",
  merchandises: [],
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
  },
});
const { form, rules } = toRefs(data);

const cancel = async () => {
  await proxy?.$modal.confirm("确认取消编辑订单吗？");
  close();
};
const close = (path = "/order") => {
  if (route.query.id) {
    path = "/order/draft";
  }
  const obj = { path: path };
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
    if (!form.value.merchandises.some((item) => item.id === it.id)) {
      form.value.merchandises.push(it);
    }
  });
};

// 初始化receipt-order-form ref
const orderForm = ref();

const totalPrice = computed(() => {
  return form.value.merchandises.reduce((acc, cur) => {
    const price = parseFloat(cur.price) || 0;
    const quantityRequired = parseInt(cur.quantityRequired) || 0;
    return acc + price * quantityRequired;
  }, 0);
});
const doSave = async (OrderStatus) => {
  //验证receiptForm表单
  orderForm.value?.validate((valid) => {
    // 校验
    if (!valid) {
      return ElMessage.error("请填写必填项");
    }
    if (form.value.merchandises?.length) {
      const invalidQuantityList = form.value.merchandises.filter(
        (it) => !it.quantityRequired
      );
      if (invalidQuantityList?.length) {
        return ElMessage.error("请选择数量");
      }
    }
    // 构建参数
    const merchandises = form.value.merchandises.map((it) => {
      return {
        merchandiseId: it.id,
        quantityRequired: it.quantityRequired,
        labelOption: it.labelOption.join(","),
        price: it.price,
      };
    });

    const params = {
      id: form.value.id,
      userId: userStore.id,
      type: form.value.type,
      remark: form.value.remark,
      totalAmount: totalPrice.value,
      merchandises: merchandises,
    };
    if (params.id) {
      updateOrder(params).then((res) => {
        if (res.code === 200) {
          ElMessage.success(res.msg);
          OrderStatus === orderStatusMap.cao_gao
            ? close("/order/draft")
            : close();
        } else {
          ElMessage.error(res.msg);
        }
      });
    } else {
      if (OrderStatus === orderStatusMap.cao_gao) {
        createDraftOrder(params).then((res) => {
          if (res.code === 200) {
            ElMessage.success(res.msg);
            close("/order/draft");
          } else {
            ElMessage.error(res.msg);
          }
        });
      } else {
        addOrder(params).then((res) => {
          if (res.code === 200) {
            ElMessage.success(res.msg);
            close();
            userStore.getInfo();
          } else {
            ElMessage.error(res.msg);
          }
        });
      }
    }
  });
};

const saveAsDraft = async () => {
  await proxy?.$modal.confirm("确认保存为草稿吗？");
  doSave(orderStatusMap.cao_gao);
};
const AddOrder = async () => {
  // if (totalPrice.value > userStore.balance) {
  //   await proxy?.$modal.confirm("余额不足, 是否先保存为草稿？");
  //   doSave(orderStatusMap.cao_gao);
  // } else {
    await proxy?.$modal.confirm("确认发布吗？");
    doSave(orderStatusMap.mai_fu_zhong);
  // }
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

// 获取订单详情
const loadDetail = (id) => {
  loading.value = true;
  getOrder(id)
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

const handleChangeQuantity = () => {
  let sum = 0;
  form.value.merchandises.forEach((it) => {
    if (it.quantityRequired) {
      sum += Number(it.quantityRequired);
    }
  });
  form.value.totalQuantity = sum;
};

const handleDeleteDetail = (row, index) => {
  form.value.merchandises.splice(index, 1);
};

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
.total-price {
  margin-top: 20px;
  text-align: right;
  .total-price-label {
    font-size: 16px;
    color: #606266;
  }
  .total-price-number {
    font-size: 28px;
    color: #f56c6c;
    font-weight: bold;
  }
}
.btn-box {
  width: calc(100% - #{$base-sidebar-width});
  display: flex;
  align-items: center;
  justify-content: space-between;
  float: right;
}
</style>
