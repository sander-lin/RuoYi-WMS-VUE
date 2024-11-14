<template>
  <div class="app-container">
    <el-card>
      <el-form
        :model="queryParams"
        ref="queryRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input
            v-model="queryParams.merchandiseName"
            placeholder="请输入商品名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="所属客户" prop="userId">
          <el-select
            v-model="queryParams.userId"
            placeholder="请选择所属客户"
            clearable
          >
            <el-option
              v-for="item in userOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value + ''"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery"
            >搜索</el-button
          >
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="mt20">
      <el-row :gutter="10" class="mb8" type="flex" justify="space-between">
        <el-col :span="6"
          ><span style="font-size: large">商品库存表</span></el-col
        >
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
            v-hasPermi="['wms:Inventories:add']"
            >批量入库</el-button
          >
          <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['wms:Inventories:export']"
            >导出</el-button
          >
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="InventoriesList" border class="mt20">
        <!-- <el-table-column label="库存ID" prop="id" v-if="true" /> -->
        <el-table-column
          label="商品"
          prop="merchandise"
          align="center"
          width="300"
        >
          <template #default="scope">
            <div class="merchandise-info">
              <img :src="scope.row.merchandise.image" alt="" />
              <div class="merchandise-info-content">
                <p>名称: {{ scope.row.merchandise.name }}</p>
                <p>型号: {{ scope.row.merchandise.type }}</p>
                <p>颜色: {{ scope.row.merchandise.color }}</p>
                <p>尺寸: {{ scope.row.merchandise.size }}</p>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="所属客户"
          prop="merchandise"
          align="center"
          width="150"
        >
          <template #default="scope">
            <div>
              {{
                userOptions.find(
                  (item) =>
                    item.value === parseInt(scope.row.merchandise.userId)
                )?.label
              }}
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="最近记录"
          prop="remark"
          align="center"
          width="250"
        />
        <el-table-column label="库存数量" prop="number" align="center" />

        <el-table-column label="单位" prop="unit" align="center" />

        <el-table-column
          label="操作"
          align="center"
          class-name="small-padding fixed-width"
        >
          <template #default="scope">
            <el-button
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['wms:Inventories:edit']"
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
    <!-- 添加或修改商品库存表对话框 -->
    <el-dialog
      title="新增库存"
      v-model="open"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form
        ref="InventoriesRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="入库数量" prop="quantity">
          <el-input-number v-model="quantity" placeholder="请输入数量" />
          <span style="margin: 0 5px"> </span>{{ form.unit }}
        </el-form-item>
        <!-- <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="请输入内容"
            rows="4"
            maxlength="100"
          />
        </el-form-item> -->
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

<script setup name="Inventories">
import {
  listInventories,
  getInventories,
  delInventories,
  addInventories,
  updateInventories,
} from "@/api/wms/Inventories";
import { useWmsStore } from "@/store/modules/wms";

const { proxy } = getCurrentInstance();
const { userOptions } = useWmsStore();

const InventoriesList = ref([]);
const open = ref(false);
const buttonLoading = ref(false);
const loading = ref(true);
const ids = ref([]);
const total = ref(0);
const title = ref("");
const quantity = ref(0);

const data = reactive({
  form: {
    id: null,
    number: Number(0),
    merchandiseId: null,
    unit: "",
    remark: "",
  },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    merchandiseId: undefined,
    merchandiseName: undefined,
    userId: undefined,
  },
  rules: {
    id: [{ required: true, message: "库存ID不能为空", trigger: "blur" }],
    number: [{ required: true, message: "数量不能为空", trigger: "blur" }],
    merchandiseId: [
      { required: true, message: "商品id不能为空", trigger: "change" },
    ],
    unit: [{ required: true, message: "单位不能为空", trigger: "blur" }],
    remark: [{ required: true, message: "备注不能为空", trigger: "blur" }],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询商品库存表列表 */
function getList() {
  loading.value = true;
  listInventories(queryParams.value).then((response) => {
    InventoriesList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    number: null,
    merchandiseId: null,
    unit: null,
    remark: null,
  };
  quantity.value = 0;
  proxy.resetForm("InventoriesRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 新增按钮操作 */
function handleAdd() {
  // reset();
  // open.value = true;
  // title.value = "添加商品库存表";
  proxy.$router.push({ path: "/inventory/receiptOrderEdit" });
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getInventories(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改商品库存表";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["InventoriesRef"].validate((valid) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id != null) {
        form.value.number =
          parseInt(form.value.number) + parseInt(quantity.value);
        form.value.remark = `入库${quantity.value}${form.value.unit}`;
        updateInventories(form.value)
          .then((response) => {
            proxy.$modal.msgSuccess("修改成功");
            open.value = false;
            getList();
          })
          .finally(() => {
            buttonLoading.value = false;
          });
      } else {
        form.value.remark = `入库${quantity.value}${form.value.unit}`;
        addInventories(form.value)
          .then((response) => {
            proxy.$modal.msgSuccess("新增成功");
            open.value = false;
            getList();
          })
          .finally(() => {
            buttonLoading.value = false;
          });
      }
    }
  });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download(
    "wms/Inventories/export",
    {
      ...queryParams.value,
    },
    `Inventories_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>

<style lang="scss" scoped>
.app-container {
  .merchandise-info {
    display: flex;
    align-items: center;
    justify-content: center;
    img {
      width: 80px;
      height: 80px;
      margin-right: 20px;
    }
    .merchandise-info-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    p {
      margin: 0;
    }
  }
}
</style>
