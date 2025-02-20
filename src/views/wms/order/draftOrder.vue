<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      label-width="68px"
      v-if="currentTab === 'orderDraft'"
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
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery"
          >搜索</el-button
        >
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-tabs v-model="currentTab" @tab-click="handleQuery" type="card">
      <el-tab-pane
        :name="item.value"
        v-for="item in tabOptions"
        :key="item.value"
        :label="item.label"
      />
    </el-tabs>
    <el-table
      v-loading="loading"
      :data="orderList"
      border
      v-if="currentTab === 'orderDraft'"
    >
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
              preview-teleported
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
      <el-table-column label="备注" prop="remark" align="center" />
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
            @click="handleEdit(scope.row)"
            v-hasPermi="['wms:order:edit']"
            >编辑</el-button
          >
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handlePublish(scope.row)"
            v-hasPermi="['wms:order:edit']"
            >发布</el-button
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
    <el-table :data="noticeList" border empty-text="暂无发货通知单" v-else>
      <el-table-column label="订单号" prop="orderId" align="center" />
      <el-table-column label="发货通知单号" prop="id" align="center" />
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
              preview-teleported
            />
            <div class="goods-info-content">
              <span>{{ `商品名称：${item.name}` }}</span>
              <span>{{ `商品型号：${item.type}` }}</span>
              <span>{{ `商品规格：${item.color}   ${item.size}` }}</span>
            </div>
            <div class="goods-info-content">
              <span>{{ `单价：${item.price}￥` }}</span>
              <span>{{ `通知发货数量：${item.quantityNotice}件` }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="配送方式"
        prop="deliveryMethod"
        align="center"
        width="200"
      >
        <template #default="{ row }">
          {{
            logisticsList.find((item) => item.id === row.deliveryMethod)?.name
          }}
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        prop="createTime"
        align="center"
        width="200"
      />
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
            @click="handleEdit(scope.row)"
            v-hasPermi="['wms:shipmentNotice:edit']"
            >编辑</el-button
          >
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handlePublish(scope.row)"
            v-hasPermi="['wms:shipmentNotice:edit']"
            >发布</el-button
          >
          <el-button
            link
            type="primary"
            @click="handleDelete(scope.row)"
            v-hasPermi="['wms:shipmentNotice:remove']"
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
import { listDraftOrder, delOrder, publishDraftOrder } from "@/api/wms/order";
import {
  listShipmentNoticeDraft,
  updateShipmentNotice,
  delShipmentNotice,
} from "@/api/wms/shipmentNotice";
import { useWmsStore } from "@/store/modules/wms";
import useUserStore from "@/store/modules/user";
import { useRoute } from "vue-router";
import mapData from "../../../utils/mapData";

const { order_type, orderStatusMap, noticeStatusMap } = mapData;
const userStore = useUserStore();
const { proxy } = getCurrentInstance();

const { logisticsList } = useWmsStore();
const route = useRoute();
const tabOptions = ref([
  { value: "orderDraft", label: "订单草稿" },
  { value: "shipmentNoticeDraft", label: "发货通知单草稿" },
]);

const currentTab = ref(route.query.currentTab || "orderDraft");
const orderList = ref([]);
const noticeList = ref([]);
const loading = ref(true);
const ids = ref([]);
const total = ref(0);

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  type: undefined,
});

/** 查询订单草稿列表 */
function getList() {
  loading.value = true;
  nextTick(() => {
    if (currentTab.value === "orderDraft") {
      listDraftOrder(queryParams.value).then((response) => {
        orderList.value = response.rows;
        total.value = response.total;
        loading.value = false;
      });
    } else if (currentTab.value === "shipmentNoticeDraft") {
      queryParams.value.type = undefined;
      listShipmentNoticeDraft(queryParams.value).then((response) => {
        noticeList.value = response.rows;
        total.value = response.total;
        loading.value = false;
      });
    }
  });
}

const handleUpdate = (row) => {
  if (currentTab.value === "orderDraft") {
    const data = {
      id: row.id,
      status: orderStatusMap.mai_fu_zhong,
      userId: row.userId,
      type: row.type,
      remark: row.remark,
      totalAmount: row.totalAmount,
      merchandises: row.merchandises,
    };
    publishDraftOrder(data).then((response) => {
      ElMessage({
        type: "success",
        message: "发布成功",
      });
      userStore.getInfo();
      getList();
    });
  } else if (currentTab.value === "shipmentNoticeDraft") {
    const data = {
      id: row.id,
      status: noticeStatusMap.wei_fa_huo,
      userId: row.userId,
      orderId: row.orderId,
      tag: row.tag,
      remark: row.remark,
      deliveryMethod: row.deliveryMethod,
    };
    updateShipmentNotice(data).then((response) => {
      ElMessage({
        type: "success",
        message: "发布成功",
      });
      getList();
    });
  }
};

const handleChangeStatus = (row) => {
  ElMessageBox.confirm(
    currentTab.value === "orderDraft"
      ? "确定要发布订单吗？"
      : "确定要发布发货通知单吗？",
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(() => {
      handleUpdate(row);
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: "已取消发布",
      });
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

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal
    .confirm(
      (currentTab.value === "orderDraft"
        ? '"是否确认删除订单编号为"'
        : '"是否确认删除发货通知单编号为"') +
        _ids +
        '"的数据项？'
    )
    .then(function () {
      loading.value = true;
      return currentTab.value === "orderDraft"
        ? delOrder(_ids)
        : delShipmentNotice(_ids);
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
