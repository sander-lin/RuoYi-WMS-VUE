<template>
  <el-drawer
    :model-value="show"
    title="商品选择"
    @close="handleCancelClick"
    :size="size"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form :inline="true" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="商品名称">
            <el-input
              v-model="query.name"
              clearable
              placeholder="商品名称"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="商品编号">
            <el-input
              class="w200"
              v-model="query.fnsku"
              clearable
              placeholder="商品编号"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" @click="clickQuery">查询</el-button>
        </el-col>
      </el-row>
    </el-form>
    <el-table
      :data="list"
      border
      :row-key="getRowKey"
      empty-text="暂无商品"
      v-loading="loading"
      ref="skuSelectFormRef"
      cell-class-name="my-cell"
    >
      <el-table-column
        type="selection"
        width="55"
        v-if="!singleSelect"
        :reserve-selection="true"
      >
        <template #default="{ row }">
          <el-checkbox
            v-model="row.isSelected"
            :disabled="selectedItem.includes(row.id)"
            @change="handleSelectionChange(row)"
          />
        </template>
      </el-table-column>
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
        width="100"
        v-if="singleSelect"
        align="right"
      >
        <template #default="{ row }">
          <el-button link type="primary" @click="handleChooseSku(row)"
            >选择</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <el-row>
      <pagination
        v-show="total > 0"
        :total="total"
        :page-sizes="[5, 10, 20, 50]"
        v-model:limit="pageReq.size"
        v-model:page="pageReq.page"
        @pagination="getList"
        class="mr10"
      />
    </el-row>
    <template v-slot:footer>
      <div style="width: 100%; display: flex; justify-content: space-between">
        <span>
          <!-- <el-button @click="goCreateItem" icon="Plus">创建商品</el-button> -->
          <el-button @click="loadAll" icon="Refresh">刷新</el-button>
        </span>
        <span>
          <el-button @click="handleCancelClick">取消</el-button>
          <el-button type="primary" @click="handleOkClick" v-if="!singleSelect"
            >确认</el-button
          >
        </span>
      </div>
    </template>
  </el-drawer>
</template>
<script setup lang="ts" name="SkuSelect">
import {
  computed,
  getCurrentInstance,
  onMounted,
  reactive,
  ref,
  nextTick,
} from "vue";
import { ElForm } from "element-plus";
import { getRowspanMethod } from "@/utils/getRowSpanMethod";
import { listItemSkuPage } from "@/api/wms/itemSku";
import { useRouter } from "vue-router";
import { useWmsStore } from "@/store/modules/wms";
import useUserStore from "@/store/modules/user";
import { listMerchandise } from "@/api/wms/merchandise";

const instance = getCurrentInstance();
const proxy = instance ? instance.proxy : null;
const { userOptions, getUserList } = useWmsStore();
const userStore = useUserStore();
const spanMethod = computed(() => getRowspanMethod(list.value, ["itemId"]));
const router = useRouter();
const loading = ref(false);
const deptOptions = ref([]);
const query = reactive({
  name: "",
  fnsku: "",
});
const selectItemSkuVoCheck = ref([]);
const skuSelectFormRef = ref<ElForm | null>(null);
const total = ref(0);
const pageReq = reactive({
  page: 1,
  size: 10,
});
const list = ref<any[]>([]);
const rightList = ref([]);
const rightListKeySet = computed(() => {
  const set = new Set();
  rightList.value.forEach((it) => set.add(it.id));
  return set;
});

const editableList = computed(() => {
  return list.value.filter((it) => !rightListKeySet.value.has(it.id));
});

const loadAll = () => {
  pageReq.page = 1;
  const pageReqCopy = { ...pageReq };
  const data = {
    ...query,
    pageNum: pageReqCopy.page,
    pageSize: pageReqCopy.size,
    userId: userStore.id,
  };
  loading.value = true;
  listMerchandise(data)
    .then((res) => {
      const content = [...res.rows];
      list.value = content.map((item) => ({
        ...item,
        isSelected: false,
      }));
      total.value = res.total;
    })
    .finally(() => (loading.value = false));
};
const getRowKey = (row: any) => {
  return row.id;
};
const getList = () => {
  const data = {
    ...query,
    pageNum: pageReq.page,
    pageSize: pageReq.size,
  };
  listMerchandise(data).then((res) => {
    const content = [...res.rows];
    list.value = content.map((item) => ({
      ...item,
      isSelected: false,
    }));
    total.value = res.total;
  });
};

const clickQuery = () => {
  pageReq.page = 1;
  loadAll();
};
const goCreateItem = () => {
  const data = proxy.$router.resolve({
    path: "/system/itemManage2",
    query: { openDrawer: true },
  });
  window.open(data.href, "_blank");
};
// 定义props
const props = defineProps<{
  modelValue?: boolean;
  size: number | string;
  singleSelect: boolean;
  selectedItem: any;
}>();

console.log("selectedItem", props.selectedItem);
const show = computed(() => {
  return props.modelValue;
});

// 定义事件
const emit = defineEmits<{
  (e: "handleCancelClick");
  (e: "handleOkClick", value);
  (e: "handleSingleOkClick", value);
}>();

function handleCancelClick() {
  emit("handleCancelClick");
  clearQuantity();
}

function handleChooseSku(row) {
  emit("handleSingleOkClick", row);
}

function handleOkClick() {
  emit("handleOkClick", selectItemSkuVoCheck.value);
  clearQuantity();
}
/** 多选框选中数据 */
const handleSelectionChange = (row) => {
  if (row.isSelected) {
    selectItemSkuVoCheck.value.push(row);
  } else {
    const index = selectItemSkuVoCheck.value.indexOf(row);
    if (index !== -1) {
      selectItemSkuVoCheck.value.splice(index, 1);
    }
  }
};

function clearQuantity() {
  skuSelectFormRef.value.clearSelection();
  // list.value.forEach((item) => {
  //   item.isSelected = false;
  // });
}

onMounted(() => {
  loadAll();
});
</script>
<style lang="scss">
.el-table .my-cell {
  vertical-align: top;
}
</style>
