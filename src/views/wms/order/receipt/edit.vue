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
              <el-table-column
                label="商品id"
                prop="itemSku.id"
                width="200"
                align="center"
              />
              <el-table-column label="图片" width="180" align="center">
                <template #default="{ row }">
                  <el-image
                    style="width: 80px; height: 80px"
                    :src="row.itemSku.image"
                    :preview-src-list="[row.itemSku.image]"
                    preview-teleported
                  />
                </template>
              </el-table-column>
              <el-table-column label="商品信息" width="250" align="center">
                <template #default="{ row }">
                  <div>商品名称：{{ row.itemSku.name }}</div>
                  <div v-if="row.itemSku.type">
                    型号：{{ row.itemSku.type }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="规格信息" width="150" align="center">
                <template #default="{ row }">
                  <div>颜色：{{ row.itemSku.color }}</div>
                  <div>尺寸：{{ row.itemSku.size }}</div>
                </template>
              </el-table-column>
              <el-table-column label="所属客户" width="160" align="center">
                <template #default="{ row }">
                  <div>
                    {{
                      userOptions?.find(
                        (item) => item.value.toString() === row.itemSku.userId
                      )?.label
                    }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="数量" prop="number" width="200">
                <template #default="{ row, $index }">
                  <el-form-item
                    :prop="`inventories[${$index}].number`"
                    :rules="rules.number"
                    label-width="0"
                  >
                    <el-input-number
                      v-model="row.number"
                      placeholder="数量"
                      :min="1"
                      :precision="0"
                      @change="handleChangeQuantity"
                    ></el-input-number>
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="单位" prop="unit" width="120">
                <template #default="{ row, $index }">
                  <el-form-item
                    :prop="`inventories[${$index}].unit`"
                    :rules="rules.unit"
                    label-width="0"
                  >
                    <el-input v-model="row.unit" placeholder="请输入单位" />
                  </el-form-item>
                </template>
              </el-table-column>

              <el-table-column label="入库时间" width="250" prop="entryTime">
                <template #default="{ row, $index }">
                  <el-form-item
                    :prop="`inventories[${$index}].entryTime`"
                    :rules="rules.entryTime"
                    label-width="0"
                  >
                  <el-date-picker
                    v-model="row.entryTime"
                    type="datetime"
                    placeholder="请选择入库时间"
                  />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="备注" width="250" prop="remark">
                <template #default="{ row }">
                  <el-input
                    type="textarea"
                    v-model="row.remark"
                    placeholder="请输入备注"
                    clearable
                  />
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
      <SkuSelect
        ref="sku-select"
        :model-value="skuSelectShow"
        @handleOkClick="handleOkClick"
        @handleCancelClick="skuSelectShow = false"
        size="80%"
        :getListRequest="addableInventoryMerchandise"
      />
    </div>
    <div class="footer-global">
      <div class="btn-box">
        <div>
          <el-button @click="doWarehousing" type="primary">完成入库</el-button>
          <el-button @click="cancel" class="mr10">取消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="ReceiptOrderEdit">
import { getCurrentInstance, reactive, ref, toRefs } from "vue";
import { batchAddInventories, addableInventoryMerchandise } from "@/api/wms/inventories";
import SkuSelect from "../../../components/SkuSelect.vue";
import { useWmsStore } from "@/store/modules/wms";
import { delReceiptOrderDetail } from "@/api/wms/receiptOrderDetail";

const { proxy } = getCurrentInstance();
const loading = ref(false);
const { userOptions } = useWmsStore();

const initFormData = {
  inventories: [],
};
const data = reactive({
  form: { ...initFormData },
  rules: {
    number: [{ required: true, message: "入库数量不能为空", trigger: "blur" }],
    unit: [{ required: true, message: "单位不能为空", trigger: "change" }],
    entryTime: [
      {
        required: true,
        message: "入库时间不能为空",
        trigger: ["blur", "change"],
      },
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
    const isExisted = form.value.inventories.some((item) => item.itemSku.id === it.id);
    if (!isExisted) {
      form.value.inventories.push({
        itemSku: { ...it },
        number: null,
        unit: null,
        remark: null,
        entryTime: null,
      });
    }
  });
};
// 选择商品 end

// 初始化receipt-order-form ref
const receiptForm = ref();

const doWarehousing = async () => {
  await proxy?.$modal.confirm("确认入库吗？");
  receiptForm.value?.validate((valid) => {
    // 校验
    if (!valid) return;
    // 构建参数
    const inventories = form.value.inventories.map((it) => {
      return {
        merchandiseId: it.itemSku.id,
        number: it.number,
        unit: it.unit,
        remark: it.remark,
        entryTime: it.entryTime,
      };
    });

    const params = {
      inventories: inventories,
    };
    batchAddInventories(params).then((res) => {
      if (res.code === 200) {
        proxy.$modal.msgSuccess("入库成功");
        close();
      } else {
        ElMessage.error(res.msg);
      }
    });
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
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.module";

.btn-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  float: right;
}
:deep(.el-form-item--default) {
  margin: 18px 0;
}
</style>
