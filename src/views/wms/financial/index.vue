<template>
  <div class="app-container">
    <el-card>
      <el-form
        :model="queryParams"
        ref="queryRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="充值客户" prop="userId" v-if="!isBuyer">
          <el-select
            v-model="queryParams.userId"
            placeholder="请选择充值客户"
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
        <el-form-item label="账单类型" prop="state" v-if="isBuyer">
          <el-select
            v-model="queryParams.state"
            placeholder="请选择账单类型"
            clearable
          >
            <el-option
              v-for="item in bill_type"
              :key="item.value"
              :label="item.label"
              :value="item.value + ''"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="daterange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="shortcuts"
            value-format="YYYY-MM-DD HH:mm:ss"
            :default-time="[
              new Date(2000, 1, 1, 0, 0, 0),
              new Date(2000, 1, 1, 23, 59, 59),
            ]"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery"
            >搜索</el-button
          >
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-if="isBuyer" class="mt20">
      <div>我的账单</div>
      <el-row class="balance-summary" gutter="20">
        <el-col :span="8" class="balance-section">
          <div class="balance-title">
            <strong>收入</strong>
          </div>
          <div class="income">¥ {{ totalIncome }}</div>
        </el-col>
        <el-col :span="8" class="balance-section">
          <div class="balance-title">
            <strong>支出</strong>
          </div>
          <div class="expense">¥ {{ totalExpenditure }}</div>
        </el-col>
        <!-- <el-col :span="8" class="balance-section">
          <div class="balance-title">
            <strong>总计</strong>
          </div>
          <div class="balance">¥ {{ totalIncome - totalExpenditure }}</div>
        </el-col> -->
      </el-row>
    </el-card>
    <el-card class="mt20">
      <el-row :gutter="10" class="mb8" type="flex" justify="space-between">
        <el-col :span="6"
          ><span style="font-size: large">账单流水</span></el-col
        >
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
            v-hasPermi="['wms:financial:add']"
            v-if="!isBuyer"
            >充值</el-button
          >
          <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['wms:financial:export']"
            >导出</el-button
          >
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="financialList" border class="mt20">
        <el-table-column label="流水号" prop="id" v-if="true" align="center" />
        <el-table-column
          label="充值客户"
          prop="userId"
          v-if="!isBuyer"
          align="center"
        >
          <template #default="scope">
            {{
              userOptions.find(
                (item) => item.value.toString() === scope.row.userId
              )?.label
            }}
          </template>
        </el-table-column>
        <el-table-column
          label="类型"
          prop="state"
          align="center"
          v-if="isBuyer"
        >
          <template #default="scope">
            <dict-tag :options="bill_type" :value="scope.row.state" />
          </template>
        </el-table-column>
        <el-table-column
          label="子类型"
          prop="event"
          v-if="isBuyer"
          align="center"
        >
          <template #default="scope">
            <span>
              <span v-if="scope.row.event?.includes('订单支出')">
                {{ scope.row.event.split("： ")[0] }}：
                <a
                  v-if="scope.row.event?.includes('订单支出')"
                  @click="handleViewDetail(scope.row.event.split('： ')[1])"
                  target="_blank"
                  style="color: #009bf9; text-decoration: none"
                >
                  {{ scope.row.event.split("： ")[1] }}
                </a>
              </span>

              <span v-else>
                {{ scope.row.event }}
              </span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="金额" prop="amount" align="center" />
        <el-table-column label="日期" prop="createTime" align="center" />
        <el-table-column
          label="操作"
          align="center"
          class-name="small-padding fixed-width"
          v-if="!isBuyer"
        >
          <template #default="scope">
            <el-button
              link
              type="primary"
              icon="Delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['wms:financial:remove']"
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
    <!-- 添加或修改资金明细表对话框 -->
    <el-dialog :title="title" v-model="open" style="width: 30%" append-to-body>
      <el-form
        ref="financialRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="充值客户" prop="userId">
          <el-select
            v-model="form.userId"
            placeholder="请选择所属客户"
            clearable
            @change="handleUserChange"
          >
            <el-option
              v-for="item in userOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value + ''"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="客户余额">
          {{ form.lastBalance || "--" }}
        </el-form-item>
        <el-form-item label="充值金额" prop="amount">
          <el-input-number v-model="form.amount" placeholder="请输入充值金额" />
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

<script setup name="Financial">
import { listFinancial, getFinancial, delFinancial } from "@/api/wms/financial";
import { getBalance, updateBalance, recharge } from "@/api/wms/financial";
import { useWmsStore } from "@/store/modules/wms";
import useUserStore from "@/store/modules/user";

const { proxy } = getCurrentInstance();
const userStore = useUserStore();
const isBuyer = userStore.roles.includes("buyer");
const { userOptions } = useWmsStore();
const { bill_type } = proxy.useDict("bill_type");
const totalExpenditure = ref();
const totalIncome = ref();
const financialList = ref([]);
const open = ref(false);
const buttonLoading = ref(false);
const loading = ref(true);
const ids = ref([]);
const total = ref(0);
const title = ref("");
const daterange = ref([]);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userId: undefined,
    state: isBuyer ? undefined : 0,
    amount: undefined,
    event: undefined,
    lastBalance: undefined,
  },
  rules: {
    id: [{ required: true, message: "不能为空", trigger: "blur" }],
    userId: [{ required: true, message: "客户id不能为空", trigger: "blur" }],
    state: [
      { required: true, message: "支出，收入状态不能为空", trigger: "blur" },
    ],
    amount: [{ required: true, message: "金额不能为空", trigger: "blur" }],
    event: [
      { required: true, message: "状态变更事件不能为空", trigger: "blur" },
    ],
  },
});

const { queryParams, form, rules } = toRefs(data);

const shortcuts = [
  {
    text: "最近一周",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    },
  },
  {
    text: "最近一个月",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    },
  },
  {
    text: "最近三个月",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
      return [start, end];
    },
  },
];

/** 查询资金明细表列表 */
function getList() {
  loading.value = true;
  listFinancial(proxy.addDateRange(queryParams.value, daterange.value)).then(
    (response) => {
      financialList.value = response.rows;
      totalExpenditure.value = response.totalExpenditure;
      totalIncome.value = response.totalIncome;
      total.value = response.total;
      loading.value = false;
    }
  );
}

function handleViewDetail(orderId) {
  proxy.$router.push({ path: "/order/orderDetail", query: { id: orderId } });
}

async function handleUserChange(value) {
  form.value.userId = value;
  await getBalance(value).then((response) => {
    form.value.lastBalance = response.data?.balance || 0;
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
    state: 0,
    amount: null,
    event: "充值",
    lastBalance: null,
  };
  proxy.resetForm("financialRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  daterange.value = [];
  handleQuery();
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "充值";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getFinancial(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改资金明细表";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["financialRef"].validate((valid) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id != null) {
        updateBalance(form.value)
          .then((response) => {
            proxy.$modal.msgSuccess("修改成功");
            open.value = false;
            getList();
          })
          .finally(() => {
            buttonLoading.value = false;
          });
      } else {
        recharge(form.value)
          .then((response) => {
            proxy.$modal.msgSuccess("充值成功");
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
    .confirm('是否确认删除资金明细表编号为"' + _ids + '"的数据项？')
    .then(function () {
      loading.value = true;
      return delFinancial(_ids);
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
    "wms/financial/export",
    {
      ...queryParams.value,
    },
    `financial_${new Date().getTime()}.xlsx`
  );
}

getList();
// getUserList();
</script>

<style lang="scss" scoped>
.balance-summary {
  padding: 40px 0;
  .balance-section {
    text-align: center;
    .balance-title {
      margin-bottom: 20px;
    }
    .income {
      color: red;
      font-size: 24px;
      font-weight: bold;
    }
    .expense {
      color: green;
      font-size: 24px;
      font-weight: bold;
    }
    .balance {
      color: black;
      font-size: 24px;
      font-weight: bold;
    }
  }
}
</style>
