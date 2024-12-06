<template>
  <div class="app-container">
    <el-card>
      <el-form
        :model="queryParams"
        ref="queryRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="" prop="value">
          <el-input
            v-model="queryParams.value"
            placeholder="请输入"
            clearable
            @keyup.enter="handleQuery"
          />
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
          ><span style="font-size: large">物流渠道</span></el-col
        >
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
            v-hasPermi="['wms:channel:add']"
            >新增</el-button
          >
          <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['wms:channel:export']"
            >导出</el-button
          >
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="channelList" border class="mt20">
        <el-table-column label="ID" prop="id" v-if="true" align="center" />
        <el-table-column label="物流渠道名称" prop="name" align="center" />
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
              v-hasPermi="['wms:channel:edit']"
              >修改</el-button
            >
            <el-button
              link
              type="primary"
              icon="Delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['wms:channel:remove']"
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
    <!-- 添加或修改物流渠道对话框 -->
    <el-dialog :title="title" v-model="open" size="50%" append-to-body>
      <el-form
        ref="channelRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="物流渠道名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" />
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

<script setup name="Channel">
import {
  listChannel,
  getChannel,
  delChannel,
  addChannel,
  updateChannel,
} from "@/api/wms/channel";

const { proxy } = getCurrentInstance();

const channelList = ref([]);
const open = ref(false);
const buttonLoading = ref(false);
const loading = ref(true);
const ids = ref([]);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
  },
  rules: {
    id: [{ required: true, message: "不能为空", trigger: "blur" }],
    name: [{ required: true, message: "不能为空", trigger: "blur" }],
    value: [{ required: true, message: "不能为空", trigger: "blur" }],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询物流渠道列表 */
function getList() {
  loading.value = true;
  listChannel(queryParams.value).then((response) => {
    channelList.value = response.rows;
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
    name: null,
    value: null,
    createTime: null,
    updateTime: null,
    createBy: null,
    updateBy: null,
  };
  proxy.resetForm("channelRef");
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
  title.value = "添加物流渠道";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getChannel(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改物流渠道";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["channelRef"].validate((valid) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id != null) {
        updateChannel(form.value)
          .then((response) => {
            proxy.$modal.msgSuccess("修改成功");
            open.value = false;
            getList();
          })
          .finally(() => {
            buttonLoading.value = false;
          });
      } else {
        form.value.value = Math.floor(Math.random() * 100);
        addChannel(form.value)
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
    .confirm('是否确认删除物流渠道编号为"' + _ids + '"的数据项？')
    .then(function () {
      loading.value = true;
      return delChannel(_ids);
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
    "wms/channel/export",
    {
      ...queryParams.value,
    },
    `channel_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>
