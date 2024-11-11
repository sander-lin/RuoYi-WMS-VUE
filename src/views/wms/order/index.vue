<template>
  <div class="app-container">
    <el-card>
      <el-form
        :model="queryParams"
        ref="queryRef"
        :inline="true"
        label-width="68px"
      >
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
        <el-col :span="6"><span style="font-size: large">订单表</span></el-col>
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
            v-hasPermi="['wms:order:add']"
            >新增</el-button
          >
          <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['wms:order:export']"
            >导出</el-button
          >
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="orderList" border class="mt20">
        <el-table-column label="" prop="id" v-if="true" />
        <el-table-column label="所属客户" prop="userId" />
        <el-table-column label="订单类型" prop="type" />
        <el-table-column label="订单状态" prop="status">
          <template #default="scope">
            <el-select
              v-model="scope.row.status"
              placeholder="请选择状态"
              clearable
              @change="showConfirmDialog"
            >
              <el-option
                v-for="item in statusList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
            <!-- 弹出确认框 -->
            <el-dialog
              title="确认选择"
              :visible.sync="dialogVisible"
              width="30%"
            >
              <p>是否确认选择 {{ selectedOption.label }}？</p>
              <span slot="footer" class="dialog-footer">
                <el-button @click="cancelSelection">取消</el-button>
                <el-button type="primary" @click="confirmSelection"
                  >确认</el-button
                >
              </span>
            </el-dialog>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" />
        <el-table-column label="选项" prop="option"> </el-table-column>
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
              v-hasPermi="['wms:order:edit']"
              >修改</el-button
            >
            <el-button
              link
              type="primary"
              icon="Delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['wms:order:remove']"
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
    <!-- 添加或修改订单表对话框 -->
    <el-drawer :title="title" v-model="open" size="50%" append-to-body>
      <el-form ref="orderRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
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

<script setup name="Order">
import {
  listOrder,
  getOrder,
  delOrder,
  addOrder,
  updateOrder,
} from "@/api/wms/order";
import {
  listMerchandise,
  getMerchandise,
  delMerchandise,
  addMerchandise,
  updateMerchandise,
} from "@/api/wms/merchandise";

const { proxy } = getCurrentInstance();

const orderList = ref([]);
const open = ref(false);
const buttonLoading = ref(false);
const loading = ref(true);
const ids = ref([]);
const total = ref(0);
const title = ref("");
const selectedValue = ref(null); // 绑定的选择值
const dialogVisible = ref(false); // 控制弹窗显示
const selectedOption = ref(null); // 暂存用户点击的选项

function showConfirmDialog(value) {
  // 暂存当前点击的选项，并显示确认弹窗
  console.log("click", value);
  selectedOption.value = statusList.find((item) => item.value === value);
  dialogVisible.value = true;
}
function confirmSelection() {
  // 确认后，选中暂存的选项
  selectedValue.value = selectedOption.value;
  dialogVisible.value = false;
}
function cancelSelection() {
  // 取消选择
  selectedOption.value = null;
  dialogVisible.value = false;
}
const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userId: undefined,
    type: undefined,
    status: undefined,
    option: undefined,
  },
  rules: {
    id: [{ required: true, message: "不能为空", trigger: "blur" }],
    userId: [{ required: true, message: "所属客户不能为空", trigger: "blur" }],
    type: [{ required: true, message: "订单类型不能为空", trigger: "change" }],
    status: [
      { required: true, message: "订单状态不能为空", trigger: "change" },
    ],
    remark: [{ required: true, message: "备注不能为空", trigger: "blur" }],
    option: [{ required: true, message: "选项不能为空", trigger: "blur" }],
    createTime: [{ required: true, message: "不能为空", trigger: "blur" }],
    updateTime: [{ required: true, message: "不能为空", trigger: "blur" }],
  },
});

const { queryParams, form, rules } = toRefs(data);

const statusList = [
  { value: "0", label: "待付款" },
  { value: "1", label: "待发货" },
  { value: "2", label: "待收货" },
  { value: "3", label: "已完成" },
  { value: "4", label: "已取消" },
];

/** 查询订单表列表 */
function getList() {
  loading.value = true;
  listMerchandise(queryParams.value).then((response) => {
    orderList.value = response.rows.map((item) => {
      return {
        id: item.id,
        userId: item.userId,
        type: Math.random() > 0.5 ? "量产订单" : "样本订单",
        status: statusList[Math.floor(Math.random() * statusList.length)].label,
        remark: item.remark || "--",
        option: item.option || "--",
        createTime: item.createTime,
        updateTime: item.updateTime,
      };
    });
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
    userId: null,
    type: null,
    status: null,
    remark: null,
    option: null,
    createTime: null,
    updateTime: null,
  };
  proxy.resetForm("orderRef");
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
  title.value = "添加订单表";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getOrder(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改订单表";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["orderRef"].validate((valid) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id != null) {
        updateOrder(form.value)
          .then((response) => {
            proxy.$modal.msgSuccess("修改成功");
            open.value = false;
            getList();
          })
          .finally(() => {
            buttonLoading.value = false;
          });
      } else {
        addOrder(form.value)
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

/** 导出按钮操作 */
function handleExport() {
  proxy.download(
    "wms/order/export",
    {
      ...queryParams.value,
    },
    `order_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>
