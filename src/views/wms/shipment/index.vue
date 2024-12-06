<template>
  <div class="app-container">
    <el-card>
      <el-form
        :model="queryParams"
        ref="queryRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="发货通知单编号" prop="shipmentNoticeId">
          <el-input
            v-model="queryParams.shipmentNoticeId"
            placeholder="请输入发货通知单编号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="物流单号" prop="logisticsNumber">
          <el-input
            v-model="queryParams.logisticsNumber"
            placeholder="请输入物流单号"
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
          ><span style="font-size: large">发货管理</span></el-col
        >
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
            v-hasPermi="['wms:shipment:add']"
            >新增</el-button
          >
          <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['wms:shipment:export']"
            >导出</el-button
          >
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="shipmentList" border class="mt20">
        <el-table-column label="" prop="id" />
        <el-table-column label="发货通知单编号" prop="shipmentNoticeId" />
        <el-table-column label="发货状态" prop="status" />
        <el-table-column label="物流渠道" prop="deliveryMethod" />
        <el-table-column label="备注" prop="remark" />
        <el-table-column label="物流单号" prop="logisticsNumber" />
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
              v-hasPermi="['wms:shipment:edit']"
              >修改</el-button
            >
            <el-button
              link
              type="primary"
              icon="Delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['wms:shipment:remove']"
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
  </div>
</template>

<script setup name="Shipment">
import {
  listShipment,
  getShipment,
  delShipment,
  addShipment,
  updateShipment,
} from "@/api/wms/shipment";

const { proxy } = getCurrentInstance();

const shipmentList = ref([]);
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
    shipmentNoticeId: undefined,
    status: undefined,
    deliveryMethod: undefined,
    logisticsNumber: undefined,
  },
  rules: {
    id: [{ required: true, message: "不能为空", trigger: "blur" }],
    shipmentNoticeId: [
      { required: true, message: "发货通知单编号不能为空", trigger: "blur" },
    ],
    status: [
      { required: true, message: "发货状态不能为空", trigger: "change" },
    ],
    deliveryMethod: [
      { required: true, message: "物流渠道不能为空", trigger: "change" },
    ],
    remark: [{ required: true, message: "备注不能为空", trigger: "blur" }],
    logisticsNumber: [
      { required: true, message: "物流单号不能为空", trigger: "blur" },
    ],
    createTime: [{ required: true, message: "不能为空", trigger: "blur" }],
    updateTime: [{ required: true, message: "不能为空", trigger: "blur" }],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询发货管理列表 */
function getList() {
  loading.value = true;
  listShipment(queryParams.value).then((response) => {
    shipmentList.value = response.rows;
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
    shipmentNoticeId: null,
    status: null,
    deliveryMethod: null,
    remark: null,
    logisticsNumber: null,
    createTime: null,
    updateTime: null,
  };
  proxy.resetForm("shipmentRef");
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
  title.value = "添加发货管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getShipment(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改发货管理";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["shipmentRef"].validate((valid) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id != null) {
        updateShipment(form.value)
          .then((response) => {
            proxy.$modal.msgSuccess("修改成功");
            open.value = false;
            getList();
          })
          .finally(() => {
            buttonLoading.value = false;
          });
      } else {
        addShipment(form.value)
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
    .confirm('是否确认删除发货管理编号为"' + _ids + '"的数据项？')
    .then(function () {
      loading.value = true;
      return delShipment(_ids);
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
    "wms/shipment/export",
    {
      ...queryParams.value,
    },
    `shipment_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>
