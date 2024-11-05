<template>
  <div class="app-container">
    <el-card>
      <el-form
        :model="queryParams"
        ref="queryRef"
        label-width="90px"
        :inline="true"
      >
        <!-- <el-form-item class="col4" label="维度 " prop="itemId">
          <el-radio-group
            v-model="queryType"
            size="medium"
            @change="handleSortTypeChange"
          >
            <el-radio-button label="warehouse">仓库</el-radio-button>
            <el-radio-button label="area">库区</el-radio-button>
            <el-radio-button label="item">商品</el-radio-button>
          </el-radio-group>
        </el-form-item> -->
        <!-- <el-form-item class="col4" label="仓库" prop="warehouseId">
          <el-select
            style="width: 100%"
            v-model="queryParams.warehouseId"
            placeholder="请选择仓库"
            @change="handleChangeWarehouse"
            filterable
            clearable
          >
            <el-option
              v-for="item in useWmsStore().warehouseList"
              :key="item.id"
              :label="item.warehouseName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="col4" label="库区" prop="areaId">
          <el-select
            style="width: 100%"
            v-model="queryParams.areaId"
            placeholder="请选择库区"
            :disabled="!queryParams.warehouseId || queryParams.type == 1"
            clearable
            filterable
          >
            <el-option
              v-for="item in useWmsStore().areaList.filter(
                (it) => it.warehouseId === queryParams.warehouseId
              )"
              :key="item.id"
              :label="item.areaName"
              :value="item.id"
            />
          </el-select>
        </el-form-item> -->
        <el-form-item class="col4" label="商品名称" prop="itemName">
          <el-input
            v-model="queryParams.itemName"
            clearable
            placeholder="商品名称"
          ></el-input>
        </el-form-item>
        <el-form-item class="col4" label="商品编号" prop="itemCode">
          <el-input
            v-model="queryParams.itemCode"
            clearable
            placeholder="商品编号"
          ></el-input>
        </el-form-item>
        <!-- <el-form-item class="col4" label="规格名称" prop="skuName">
          <el-input
            v-model="queryParams.skuName"
            clearable
            placeholder="规格名称"
          ></el-input>
        </el-form-item>
        <el-form-item class="col4" label="规格编号" prop="skuCode">
          <el-input
            v-model="queryParams.skuCode"
            clearable
            placeholder="规格编号"
          ></el-input>
        </el-form-item> -->
        <el-form-item class="col4" style="margin-left: 32px">
          <el-button type="primary" icon="Search" @click="handleQuery"
            >搜索</el-button
          >
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="mt20">
      <div class="mb8 flex-space-between">
        <div style="font-size: large">库存统计</div>
        <div :span="1.5">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
            v-hasPermi="['wms:receipt:all']"
            >批量入库</el-button
          >
        </div>
      </div>
      <el-table
        :data="inventoryList"
        border
        :span-method="spanMethod"
        cell-class-name="vertical-top-cell"
        v-loading="loading"
        empty-text="暂无库存"
      >
        <template v-if="queryType == 'warehouse' || queryType == 'area'">
          <el-table-column label="仓库" prop="warehouseId">
            <template #default="{ row }">
              <div>
                {{
                  useWmsStore().warehouseMap.get(row.warehouseId)?.warehouseName
                }}
              </div>
            </template>
          </el-table-column>
          <template v-if="queryType == 'area'">
            <el-table-column label="库区" prop="areaId">
              <template #default="{ row }">
                <div>{{ useWmsStore().areaMap.get(row.areaId)?.areaName }}</div>
              </template>
            </el-table-column>
          </template>
          <el-table-column
            label="商品信息"
            :prop="
              queryType == 'warehouse'
                ? 'warehouseIdAndItemId'
                : 'areaIdAndItemId'
            "
          >
            <template #default="{ row }">
              <div>{{ row.item.itemName }}</div>
              <div v-if="row.item.itemCode">
                商品编号：{{ row.item.itemCode }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="规格信息" :prop="skuId">
            <template #default="{ row }">
              <div>{{ row.itemSku.skuName }}</div>
              <div v-if="row.itemSku.skuCode">
                规格编号：{{ row.itemSku.skuCode }}
              </div>
            </template>
          </el-table-column>
        </template>
        <template v-else>
          <el-table-column label="商品信息" prop="itemId" align="center">
            <template #default="{ row }">
              <div>{{ row.item.itemName }}</div>
              <div v-if="row.item.itemCode">
                商品编号：{{ row.item.itemCode }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="规格信息" prop="skuId" align="center">
            <template #default="{ row }">
              <div>{{ row.itemSku.skuName }}</div>
              <div v-if="row.itemSku.skuCode">
                规格编号：{{ row.itemSku.skuCode }}
              </div>
            </template>
          </el-table-column>
          <!-- <el-table-column label="仓库" prop="skuIdAndWarehouseId">
            <template #default="{ row }">
              <div>
                {{
                  useWmsStore().warehouseMap.get(row.warehouseId)?.warehouseName
                }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="所属库区" prop="areaName">
            <template #default="{ row }">
              <div>{{ useWmsStore().areaMap.get(row.areaId)?.areaName }}</div>
            </template>
          </el-table-column> -->
          <el-table-column label="备注" prop="remark" align="center">
            <template #default="{ row }">
              <div>{{ row.remark || "--" }}</div>
            </template>
          </el-table-column>
        </template>
        <el-table-column label="库存" prop="quantity" align="center">
          <template #default="{ row }">
            <el-statistic :value="Number(row.quantity)" :precision="0" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" prop="id" width="200">
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)"
              >入库</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <el-row>
        <pagination
          v-show="total > 0"
          :total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </el-row>
    </el-card>
    <el-dialog
      title="新增库存"
      v-model="dialogVisible"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form
        ref="warehouseFormRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="入库数量" prop="quantity">
          <el-input-number v-model="form.quantity" placeholder="请输入数量" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            placeholder="请输入备注"
            type="textarea"
            rows="4"
            maxlength="100"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm"
            >确 定</el-button
          >
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Inventory">
import {
  listInventoryBoard,
  getInventory,
  updateInventory,
  addInventory,
} from "@/api/wms/inventory";
import { computed, getCurrentInstance, onMounted, reactive, ref } from "vue";
import { ElForm, ElMessage } from "element-plus";
import { getRowspanMethod } from "@/utils/getRowSpanMethod";
import { useWmsStore } from "@/store/modules/wms";
import { warehousing } from "@/api/wms/receiptOrder";

const { proxy } = getCurrentInstance();
const spanMethod = computed(() =>
  getRowspanMethod(inventoryList.value, rowSpanArray.value)
);

const warehouseFormRef = ref(ElForm);
const dialogVisible = ref(false);
const currentInventory = ref();
const inventoryList = ref([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const rowSpanArray = ref([
  "warehouseId",
  "warehouseIdAndItemId",
  "warehouseIdAndSkuId",
]);

const form = ref({
  id: undefined,
  remark: undefined,
  warehouseId: "1828364740028174337",
  areaId: "1829397566185992193",
  skuId: undefined,
  quantity: 0,
});
const rules = ref({
  quantity: [
    { required: true, message: "请输入数量", trigger: "blur" },
    { type: "number", message: "请输入数字", trigger: "blur" },
  ],
});

const filterable = ref(false);
const queryType = ref("item");
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  skuId: undefined,
  warehouseId: "1828364740028174337",
  areaId: "1829397566185992193",
  itemName: undefined,
  itemCode: undefined,
  skuName: undefined,
  skuCode: undefined,
  minQuantity: undefined,
});

/** 新增按钮操作 */
const handleAdd = () => {
  proxy.$router.push({ path: "/inventory/receiptOrderEdit" });
};

const handleUpdate = (row) => {
  dialogVisible.value = true;
  proxy.resetForm("warehouseFormRef");
  getInventory(row.id).then((res) => {
    if (res.code === 200) {
      form.value.id = res.data.id;
      form.value.warehouseId = res.data.warehouseId;
      form.value.areaId = res.data.areaId;
      form.value.skuId = res.data.skuId;
      currentInventory.value = Number(res.data.quantity);
    }
  });
};

const submitForm = async () => {
  await warehouseFormRef.value?.validate((valid) => {
    // 校验
    if (form.value.quantity <= 0) {
      return ElMessage.error("请输入大于0的数量");
    }
    buttonLoading.value = true;
    form.value.quantity = currentInventory.value + form.value.quantity;
    updateInventory(form.value).then((res) => {
      if (res.code === 200) {
        dialogVisible.value = false;
        getList();
        buttonLoading.value = false;
        ElMessage.success("入库成功");
      } else {
        ElMessage.success("入库失败");
        buttonLoading.value = false;
      }
    });
  });
};

const cancel = () => {
  dialogVisible.value = false;
};

/** 查询库存列表 */
const getList = async () => {
  const query = { ...queryParams.value };
  if (filterable.value) {
    query.minQuantity = 1;
  } else {
    query.minQuantity = undefined;
  }
  loading.value = true;
  const res = await listInventoryBoard(queryParams.value, queryType.value);
  inventoryList.value = res.rows;
  inventoryList.value.forEach((it) => {
    if (queryType.value == "warehouse") {
      it.warehouseIdAndItemId = it.warehouseId + "-" + it.itemSku.itemId;
    } else if (queryType.value == "area") {
      it.areaIdAndItemId = it.areaId + "-" + it.itemSku.itemId;
    } else if (queryType.value == "item") {
      it.itemId = it.itemSku.itemId;
      it.skuIdAndWarehouseId = it.skuId + "-" + it.warehouseId;
    }
  });
  total.value = res.total;
  loading.value = false;
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  proxy.resetForm("queryRef");
  handleQuery();
};
const calcSubtotal = (row) => {
  const tempList = inventoryList.value.filter((it) => it.itemId === row.itemId);
  let sum = 0;
  tempList.forEach((it) => {
    sum += Number(it.quantity);
  });
  return sum;
};

const handleSortTypeChange = (e) => {
  if (e === "warehouse") {
    queryParams.value.areaId = undefined;
    rowSpanArray.value = ["warehouseId", "warehouseIdAndItemId"];
  } else if (e === "area") {
    rowSpanArray.value = ["warehouseId", "areaId", "areaIdAndItemId"];
  } else if (e === "item") {
    rowSpanArray.value = ["itemId", "skuId", "skuIdAndWarehouseId"];
  }
  queryParams.value.pageNum = 1;
  getList();
};

const handleChangeFilterZero = (e) => {
  queryParams.value.pageNum = 1;
  getList();
};

const handleChangeWarehouse = () => {
  queryParams.value.areaId = undefined;
};

onMounted(() => {
  getList();
});
</script>
<style>
.el-statistic__content {
  font-size: 14px;
}
.el-table .vertical-top-cell {
  vertical-align: top;
}
</style>
