<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      label-width="120px"
    >
      <el-form-item label="发货通知单编号" prop="id">
        <el-input
          v-model="queryParams.id"
          placeholder="请输入发货通知单编号"
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
    <el-tabs v-model="queryParams.status" @tab-click="handleQuery" type="card">
      <el-tab-pane name="" label="全部" />
      <el-tab-pane
        :name="item.value"
        v-for="item in shipping_notice_status?.filter(
          (item) => item.value !== noticeStatusMap.cao_gao
        )"
        :key="item.value"
        :label="item.label"
      />
    </el-tabs>
    <el-table :data="noticeList" border empty-text="暂无发货通知单">
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
            logisticsList?.find((item) => item.id === row.deliveryMethod)?.name
          }}
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="status" align="center" width="200">
        <template #default="{ row }">
          <dict-tag :options="shipping_notice_status" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="所属客户"
        prop="userId"
        align="center"
        v-if="!isBuyer"
      >
        <template #default="scope">
          {{
            userOptions?.find(
              (item) => item.value.toString() === scope.row.userId
            )?.label
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
            @click="handleViewDetail(scope.row)"
            v-hasPermi="['wms:shipmentNotice:query']"
            >查看详情</el-button
          >
          <el-button
            link
            type="primary"
            @click="handleAdd(scope.row)"
            v-hasPermi="['wms:shipment:add']"
            v-if="
              [
                noticeStatusMap.wei_fa_huo,
                noticeStatusMap.bu_fen_fa_huo,
              ].includes(scope.row.status)
            "
            >创建发货单</el-button
          >
          <el-button
            link
            type="primary"
            @click="handleDelete(scope.row)"
            v-hasPermi="['wms:shipmentNotice:remove']"
            v-if="scope.row.status === noticeStatusMap.cao_gao"
            >删除</el-button
          >
          <el-button
            link
            type="primary"
            @click="handleChangeStatus(scope.row)"
            v-hasPermi="['wms:shipmentNotice:edit']"
            v-if="
              ![noticeStatusMap.cao_gao, noticeStatusMap.yi_guan_bi].includes(
                scope.row.status
              )
            "
            >关闭</el-button
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
  listShipmentNotice,
  getShipmentNotice,
  delShipmentNotice,
  addShipmentNotice,
  updateShipmentNotice,
} from "@/api/wms/shipmentNotice";
import { useWmsStore } from "@/store/modules/wms";
import useUserStore from "@/store/modules/user";
import mapData from "../../../utils/mapData";

const { shipping_notice_status, noticeStatusMap } = mapData;
const { proxy } = getCurrentInstance();

const { userOptions } = useWmsStore();
const userStore = useUserStore();

const isBuyer = computed(() => {
  return userStore.roles[0] === "buyer";
});
const { logisticsList } = useWmsStore();
const noticeList = ref([]);
const loading = ref(true);
const ids = ref([]);
const total = ref(0);
const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userId: undefined,
    type: undefined,
    status: "",
    labelOption: undefined,
  },
});

const { queryParams } = toRefs(data);

/** 查询发货通知单列表 */
function getList() {
  loading.value = true;
  nextTick(() => {
    listShipmentNotice(queryParams.value).then((response) => {
      noticeList.value = response.rows;
      total.value = response.total;
      loading.value = false;
    });
  });
}

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
function handleAdd(row) {
  proxy.$router.push({
    path: "/shipment/create",
    query: { shipmentId: row.id },
  });
}

const handleChangeStatus = (row) => {
  ElMessageBox.confirm("确定要关闭该发货通知单吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      const data = {
        id: row.id,
        status: noticeStatusMap.value.yi_guan_bi,
        userId: row.userId,
        orderId: row.orderId,
        tag: row.tag,
        remark: row.remark,
        deliveryMethod: row.deliveryMethod,
      };
      updateShipmentNotice(data).then((response) => {
        ElMessage({
          type: "success",
          message: "关闭成功",
        });
      });
      getList();
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: "已取消关闭",
      });
    });
};

/** 查看按钮操作 */
function handleViewDetail(row) {
  proxy.$router.push({ path: "/shipmentNotice/detail", query: { id: row.id } });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal
    .confirm('是否确认删除订单表编号为"' + _ids + '"的数据项？')
    .then(function () {
      loading.value = true;
      return delShipmentNotice(_ids);
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
