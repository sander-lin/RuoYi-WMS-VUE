<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="订单类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择订单类型"
          clearable
        >
          <el-option
            v-for="dict in order_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="所属客户" prop="userId" v-if="!isBuyer()">
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
      <el-form-item>
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['wms:order:add']"
          >创建订单</el-button
        >
      </el-form-item>
      <el-form-item>
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['wms:order:export']"
        >导出</el-button>
      </el-form-item>
    </el-form>
    
    <el-tabs v-model="queryParams.status" @tab-click="handleQuery" type="card">
      <el-tab-pane name="" label="全部" />
      <el-tab-pane
        :name="item.value"
        v-for="item in order_status.filter(
          (item) => item.value !== orderStatusMap.cao_gao
        )"
        :key="item.value"
        :label="item.label"
      />
    </el-tabs>
    <el-table 
      v-loading="loading" 
      :data="orderList" 
      stripe
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column type="index" width="50" />
      <el-table-column label="订单编号" prop="id" v-if="true" align="center" />
      <el-table-column
        prop="merchandises"
        label="商品信息"
        width="500"
        align="center"
      >
        <template #default="{ row }">
          <div
            v-for="item in row.merchandises"
            :key="item.id"
            class="goods-info"
          >
            <el-image
              :src="item.image"
              :preview-src-list="[item.image]"
              fit="cover"
              class="goods-image"
            />
            <div class="goods-info-content">
              <span>{{ `商品名称：${item.name}` }}</span>
              <span>{{ `商品型号：${item.type}` }}</span>
              <span>{{ `商品规格：${item.color}   ${item.size}` }}</span>
            </div>
            <div class="goods-info-content">
              <span>{{ `单价：${item.price}￥` }}</span>
              <span>{{ `数量：${item.quantityRequired}件` }}</span>
              <span>{{ `小计：${item.price * item.quantityRequired}￥` }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="totalAmount"
        label="价格总额"
        width="120"
        align="center"
      ></el-table-column>
      <el-table-column label="订单类型" prop="type" align="center">
        <template #default="scope">
          <dict-tag :options="order_type" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column
        prop="status"
        label="订单状态"
        width="150"
        align="center"
      >
        <template #default="scope">
          <el-select
            :disabled="isBuyer()"
            v-model="scope.row.status"
            @change="handleChangeStatus(scope.row)"
          >
            <el-option
              v-for="item in order_status.filter(
                (item) => item.value !== orderStatusMap.cao_gao
              )"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" align="center" />
      <el-table-column
        label="所属客户"
        prop="userId"
        align="center"
        v-if="!isBuyer()"
      >
        <template #default="{ row }">
          {{
            userOptions.find((item) => item.value.toString() === row.userId)
              ?.label
          }}
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="View"
            @click="handleViewDetail(scope.row)"
            v-hasPermi="['wms:order:edit']"
            >详情</el-button
          >
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleAddShipmentNotice(scope.row)"
            v-hasPermi="['wms:shipmentNotice:add']"
            v-if="
              !scope.row.merchandises.every(
                (it) => it.totalQuantityNotice === it.quantityRequired
              )
            "
            >创建发货通知单</el-button
          >
          <el-button
            link
            type="primary"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['wms:order:remove']"
            v-if="
              scope.row.merchandises.every(
                (it) => it.totalQuantityNotice === null
              )
            "
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
  </div>
</template>

<script setup name="Order">
import { ElMessageBox, ElMessage } from "element-plus";
import {
  listOrder,
  delOrder,
  updateOrder,
  updateOrderStatus,
} from "@/api/wms/order";
import { useWmsStore } from "@/store/modules/wms";
import useUserStore from "@/store/modules/user";
import mapData from "../../../utils/mapData";

const { proxy } = getCurrentInstance();
const userStore = useUserStore();
const { userOptions } = useWmsStore();

const { order_status, order_type, orderStatusMap } = mapData;
const multipleSelection = ref([]);
const orderList = ref([]);
const loading = ref(true);
const ids = ref([]);
const total = ref(0);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userId: undefined,
    type: undefined,
    status: "",
    labelOption: undefined,
  },
  rules: {
    id: [{ required: true, message: "不能为空", trigger: "blur" }],
    userId: [{ required: true, message: "所属客户不能为空", trigger: "blur" }],
    type: [{ required: true, message: "订单类型不能为空", trigger: "change" }],
    status: [
      { required: true, message: "订单状态不能为空", trigger: "change" },
    ],
    remark: [{ required: true, message: "备注不能为空", trigger: "blur" }],
    labelOption: [
      { required: true, message: "选项不能为空", trigger: "change" },
    ],
    createTime: [{ required: true, message: "不能为空", trigger: "blur" }],
    updateTime: [{ required: true, message: "不能为空", trigger: "blur" }],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询订单表列表 */
function getList() {
  loading.value = true;
  nextTick(() => {
    listOrder(queryParams.value).then((response) => {
      orderList.value = response.rows;
      total.value = response.total;
      loading.value = false;
    });
  });
}

const handleChangeStatus = (row) => {
  ElMessageBox.confirm("确定要修改订单状态吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      const data = {
        id: row.id,
        status: row.status,
        userId: row.userId,
        type: row.type,
        remark: row.remark,
        totalAmount: row.totalAmount,
      };
      updateOrderStatus(data).then((response) => {
        ElMessage({
          type: "success",
          message: "修改成功",
        });
      });
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: "已取消修改",
      });
      getList();
    });
};

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  queryParams.value.status = "";
  handleQuery();
}

const handleSelectionChange = (val) => {
  console.log(val)
  multipleSelection.value = val
}

/** 新增按钮操作 */
function handleAdd() {
  proxy.$router.push({ path: "/order/orderEdit" });
}

function handleEdit(row) {
  proxy.$router.push({ path: "/order/orderEdit", query: { id: row.id } });
}

function handlePublish(row) {
  handleChangeStatus(row);
}

/** 查看详情按钮操作 */
function handleViewDetail(row) {
  proxy.$router.push({ path: "/order/orderDetail", query: { id: row.id } });
}

const handleAddShipmentNotice = (row) => {
  proxy.$router.push({
    path: "/shipmentNotice/create",
    query: { orderId: row.id },
  });
};

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal
    .confirm("正在删除订单，是否继续？")
    .then(function () {
      loading.value = true;
      return delOrder(_ids);
    })
    .then(() => {
      loading.value = true;
      getList();
      userStore.getInfo();
      proxy.$modal.msgSuccess("删除成功");
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false;
    });
}

/** 导出按钮操作 */
function handleExport() {
  
  if(multipleSelection.value.length === 0){
    proxy.$modal.msgError("请勾选要导出的订单");
    return
  }
  proxy.downloadByJson(
    "wms/order/export",
    multipleSelection.value.map(e=> e.id),
    `order_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>

<style lang="scss" scoped>
.app-container {
  .goods-info {
    display: flex;
    align-items: center;
    padding: 5px;
    justify-content: space-between;
    &:not(:last-child) {
      border-bottom: 1px solid #eaeaea;
    }

    .goods-image {
      width: 80px;
      height: 80px;
      border-radius: 4px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .goods-info-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      &:not(:last-child) {
        margin: 0 20px;
      }
    }
  }
}
</style>
