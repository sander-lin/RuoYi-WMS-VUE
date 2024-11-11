<template>
  <div class="app-container">
    <el-card>
      <el-form
        :model="queryParams"
        ref="queryRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="FNSKU" prop="fnsku">
          <el-input
            v-model="queryParams.fnsku"
            placeholder="请输入FNSKU"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="ASIN" prop="asin">
          <el-input
            v-model="queryParams.asin"
            placeholder="请输入ASIN"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input
            v-model="queryParams.name"
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
          ><span style="font-size: large">商品管理</span></el-col
        >
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
            v-hasPermi="['wms:merchandise:add']"
            >新增</el-button
          >
          <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['wms:merchandise:export']"
            >导出</el-button
          >
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="merchandiseList" border class="mt20">
        <el-table-column label="商品编号" prop="id" v-if="true" />
        <el-table-column label="FNSKU" prop="fnsku" />
        <el-table-column label="ASIN" prop="asin" />
        <el-table-column label="商品名称" prop="name" />
        <el-table-column label="图片" align="center" prop="image" width="100">
          <template #default="scope">
            <image-preview :src="scope.row.image" :width="50" :height="50" />
          </template>
        </el-table-column>
        <el-table-column label="尺寸" prop="size" />
        <el-table-column label="颜色" prop="color" />
        <el-table-column label="型号" prop="type" />
        <el-table-column label="单价" prop="price" />
        <el-table-column label="所属用户" prop="userId">
          <template #default="scope">
            {{
              userOptions.find(
                (item) => item.value === parseInt(scope.row.userId)
              )?.label
            }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          align="right"
          class-name="small-padding fixed-width"
        >
          <template #default="scope">
            <el-button
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['wms:merchandise:edit']"
              >修改</el-button
            >
            <el-button
              link
              type="primary"
              icon="Delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['wms:merchandise:remove']"
              >删除</el-button
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
    <!-- 添加或修改商品管理对话框 -->
    <el-drawer :title="title" v-model="open" size="50%" append-to-body>
      <el-form
        ref="merchandiseRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="FNSKU" prop="fnsku">
          <el-input v-model="form.fnsku" placeholder="请输入FNSKU" />
        </el-form-item>
        <el-form-item label="ASIN" prop="asin">
          <el-input v-model="form.asin" placeholder="请输入ASIN" />
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="型号" prop="type">
          <el-input v-model="form.type" placeholder="请输入型号" />
        </el-form-item>
        <el-form-item label="尺寸" prop="size">
          <el-input v-model="form.size" placeholder="请输入尺寸" />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-input v-model="form.color" placeholder="请输入颜色" />
        </el-form-item>
        <el-form-item label="图片" prop="image">
          <image-upload v-model="form.image" />
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number v-model="form.price" placeholder="请输入单价" />
        </el-form-item>
        <el-form-item label="所属客户" prop="userId">
          <el-select
            v-model="form.userId"
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
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm"
            >确 定</el-button
          >
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup name="Merchandise">
import {
  listMerchandise,
  getMerchandise,
  delMerchandise,
  addMerchandise,
  updateMerchandise,
} from "@/api/wms/merchandise";
import { useWmsStore } from "@/store/modules/wms";

const { proxy } = getCurrentInstance();

const merchandiseList = ref([]);
const open = ref(false);
const buttonLoading = ref(false);
const loading = ref(true);
const ids = ref([]);
const total = ref(0);
const title = ref("");

const { userOptions, getUserList } = useWmsStore();

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    fnsku: undefined,
    asin: undefined,
    name: undefined,
    size: undefined,
    color: undefined,
    type: undefined,
    image: undefined,
    userId: undefined,
    price: undefined,
  },
  rules: {
    // id: [{ required: true, message: "不能为空", trigger: "blur" }],
    fnsku: [{ required: true, message: "FNSKU不能为空", trigger: "blur" }],
    asin: [{ required: true, message: "ASIN不能为空", trigger: "blur" }],
    name: [{ required: true, message: "商品名称不能为空", trigger: "blur" }],
    // size: [{ required: true, message: "尺寸不能为空", trigger: "blur" }],
    // color: [{ required: true, message: "颜色不能为空", trigger: "blur" }],
    type: [{ required: true, message: "型号不能为空", trigger: "change" }],
    // image: [{ required: true, message: "图片不能为空", trigger: "blur" }],
    userId: [
      { required: true, message: "所属用户不能为空", trigger: "change" },
    ],
    price: [{ required: true, message: "单价不能为空", trigger: "blur" }],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询商品管理列表 */
function getList() {
  loading.value = true;
  listMerchandise(queryParams.value).then((response) => {
    merchandiseList.value = response.rows;
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
    fnsku: null,
    asin: null,
    name: null,
    size: null,
    color: null,
    type: null,
    image: null,
    userId: null,
    price: null,
    updateTime: null,
    createTime: null,
  };
  proxy.resetForm("merchandiseRef");
}

function handleUploadSuccess(response) {
  console.log(response);
  form.value.image.push(response.data.url);
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
  reset();
  open.value = true;
  title.value = "添加商品管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getMerchandise(_id).then((response) => {
    form.value = response.data;

    open.value = true;
    title.value = "修改商品管理";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["merchandiseRef"].validate((valid) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id != null) {
        updateMerchandise(form.value)
          .then((response) => {
            proxy.$modal.msgSuccess("修改成功");
            open.value = false;
            getList();
          })
          .finally(() => {
            buttonLoading.value = false;
          });
      } else {
        addMerchandise(form.value)
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

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal
    .confirm('是否确认删除商品管理编号为"' + _ids + '"的数据项？')
    .then(function () {
      loading.value = true;
      return delMerchandise(_ids);
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

/** 导出按钮操作 */
function handleExport() {
  proxy.download(
    "wms/merchandise/export",
    {
      ...queryParams.value,
    },
    `merchandise_${new Date().getTime()}.xlsx`
  );
}

getList();
// getUserList();
</script>
