<template>
  <div class="app-container">
    <el-card class="mt20">
      <div style="display: flex; align-items: start">
        <div style="width: 100%; position: relative">
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
            "
          >
            <span style="font-size: 18px; line-height: 18px">商品分类</span>
            <el-button
              class="mr10"
              style="font-size: 12px; line-height: 14px"
              plain
              @click="handleAddType(false)"
              type="primary"
              icon="Plus"
              >新增分类
            </el-button>
          </div>
          <el-tree
            :data="deptOptions"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            class="mr10 mt10"
            @nodeClick="handleQueryType"
            :default-expand-all="true"
            :highlight-current="true"
            node-key="label"
            current-node-key="全部"
            draggable
            :allow-drop="collapse"
            @node-drop="handleNodeDrop"
            :expand-on-click-node="false"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <span>{{ node.label }}</span>
                <span>
                  <el-button
                    type="primary"
                    @click.stop="append(data)"
                    link
                    v-if="data.label !== '全部' && node.level < 2"
                    icon="Plus"
                    style="font-size: 12px"
                    >新增子分类</el-button
                  >
                  <el-button
                    type="primary"
                    @click.stop="remove(node, data)"
                    link
                    v-if="data.label !== '全部'"
                    icon="Delete"
                    style="font-size: 12px"
                    >删除</el-button
                  >
                  <el-button
                    type="primary"
                    icon="Edit"
                    @click.stop="edit(node, data)"
                    link
                    v-if="data.label !== '全部'"
                    style="font-size: 12px"
                    >修改</el-button
                  >
                </span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>
    </el-card>
    <!-- 添加或修改物料类型对话框 -->
    <el-dialog
      :title="categoryDialog.title"
      v-model="categoryDialog.visible"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form
        ref="itemCategoryFormRef"
        :model="categoryForm"
        :rules="typeRules"
        label-width="128px"
        @submit.native.prevent
      >
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="categoryForm.parentId"
            :data="deptOptions2"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="上级分类"
            check-strictly
            style="width: 100% !important"
            clearable
          />
        </el-form-item>
        <el-form-item label="商品分类名称" prop="categoryName">
          <el-input
            v-model="categoryForm.categoryName"
            placeholder="请输入商品分类名称"
            @keyup.enter="submitCategoryForm"
          />
        </el-form-item>
        <!--        <el-form-item label="显示顺序" prop="orderNum">-->
        <!--          <el-input-number v-model="categoryForm.orderNum" controls-position="right" :min="0"/>-->
        <!--        </el-form-item>-->
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button
            :loading="buttonLoading"
            type="primary"
            @click="submitCategoryForm"
            >确 定</el-button
          >
          <el-button @click="cancelType">取 消</el-button>
        </div>
      </template>
      <div id="qrcode"></div>
    </el-dialog>
    <div id="outSkuIdBox" style="display: none">
      <img :src="qrcode" />
      <canvas ref="barcode"></canvas>
    </div>
  </div>
</template>

<script setup name="Item">
import { getItem, delItem, addItem, updateItem } from "@/api/wms/item";
import {
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  reactive,
  ref,
  toRefs,
} from "vue";
import { ElForm, ElMessageBox, ElTree, ElTreeSelect } from "element-plus";
import {
  treeSelectItemCategory,
  updateItemCategory,
  addItemCategory,
  delItemCategory,
  updateOrderNum,
} from "@/api/wms/itemCategory";
import { getRowspanMethod } from "@/utils/getRowSpanMethod";
import { listItemSkuPage, delItemSku } from "@/api/wms/itemSku";
import { useRoute } from "vue-router";
import Qrcode from "qrcode";
import JSBarcode from "jsbarcode";
import { useWmsStore } from "@/store/modules/wms";

const barcode = ref(null);
const route = useRoute();
const { proxy } = getCurrentInstance();
const itemList = ref([]);
const deptOptions = ref([]);
const deptOptions2 = ref([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const skuLoading = ref(false);
const queryFormRef = ref(ElForm);
const itemFormRef = ref(ElForm);
const itemCategoryFormRef = ref(ElForm);
const spanMethod = computed(() =>
  getRowspanMethod(itemList.value, rowSpanArray.value)
);
const rowSpanArray = ref(["itemId", "itemCategoryId"]);
const qrcode = ref(null);
const append = (data) => {
  // resetType();
  categoryForm.value.categoryName = undefined;
  categoryForm.value.parentId = data.id;
  categoryDialog.visible = true;
};

const remove = async (node, data) => {
  const ids = data.id;
  await proxy?.$modal.confirm("确认删除分类【" + data.label + "】吗？");
  await delItemCategory(ids);
  proxy?.$modal.msgSuccess("删除成功");
  Promise.all([
    useWmsStore().getItemCategoryList(),
    useWmsStore().getItemCategoryTreeList(),
  ]).then(() => getItemCategoryTreeSelect());
};
const edit = (node, data) => {
  if (node.level > 1) {
    categoryForm.value.parentId = node.parent.data.id;
  }
  categoryForm.value.id = data.id;
  // resetType();
  categoryForm.value.categoryName = data.label;
  categoryDialog.title = "修改商品分类";
  categoryDialog.visible = true;
};
const dialog = reactive({
  visible: false,
  title: "",
});
const categoryDialog = reactive({
  visible: false,
  title: "",
});
const showParent = ref(false);

const initCategoryFormData = {
  id: undefined,
  parentId: undefined,
  ancestors: undefined,
  categoryName: undefined,
  orderNum: 0,
  status: undefined,
};

const categoryData = reactive({
  form: { ...initCategoryFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 1000,
    parentId: undefined,
    categoryName: undefined,
    orderNum: undefined,
    status: undefined,
  },
  rules: {
    id: [{ required: true, message: "商品分类id不能为空", trigger: "blur" }],
    // parentId: [
    //   {required: true, message: "父物料类型id不能为空", trigger: "blur"}
    // ],
    categoryName: [
      { required: true, message: "商品分类名称不能为空", trigger: "blur" },
    ],
    status: [
      { required: true, message: "商品分类状态不能为空", trigger: "change" },
    ],
  },
});

const {
  queryParams: typeQueryParams,
  form: categoryForm,
  rules: typeRules,
} = toRefs(categoryData);
const currentType = ref();

const getItemCategoryTreeSelect = async () => {
  const data = [...useWmsStore().itemCategoryTreeList];
  deptOptions2.value = [...useWmsStore().itemCategoryTreeList];
  data.unshift({
    id: -1,
    label: "全部",
    children: [],
  });
  deptOptions.value = data;
  console.info("getItemCategoryTreeSelect");
};
const handleAddType = (show) => {
  categoryDialog.title = "新增商品分类";
  showParent.value = show;
  categoryDialog.visible = true;
  if (show) {
    categoryForm.value.parentId = undefined;
  }
  nextTick(() => {
    categoryForm.value.categoryName = undefined;
  });
};
const skuForm = reactive({
  itemSkuList: [],
});
const skuFormRef = ref(ElForm);
const skuRules = {
  skuName: [{ required: true, message: "规格名称不能为空", trigger: "blur" }],
};
// sku 管理
const resetItemSkuList = () => {
  skuForm.itemSkuList = [];
  skuForm.itemSkuList.push({
    id: "",
    itemId: "",
    barcode: "",
    inPrice: null,
    outPrice: null,
    skuName: "",
    quantity: null,
  });
};

const collapse = (draggingNode, dropNode, type) => {
  //注掉的是同级拖拽
  if (
    draggingNode.data.label !== "全部" &&
    draggingNode.level === dropNode.level &&
    draggingNode.parent.id == dropNode.parent.id
  ) {
    if (dropNode.data.label === "全部") {
      return type === "next";
    } else {
      return type === "prev" || type === "next";
    }
  } else {
    // 不同级进行处理
    return false;
  }
};
const handleNodeDrop = async (draggingNode, dropNode, dropType, ev) => {
  if (dropNode.level === 1) {
    await updateOrderNum(dropNode.parent.data.filter((it) => it.id !== -1));
  } else {
    await updateOrderNum(dropNode.parent.data.children);
  }
};

const cancelType = () => {
  resetType();
  categoryDialog.visible = false;
};
/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  itemFormRef.value.resetFields();
};

/** 表单重置 */
const resetType = () => {
  categoryForm.value = { ...initCategoryFormData };
  itemCategoryFormRef.value.resetFields();
};
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields();
  handleQuery();
};

/** 新增按钮操作 */
const handleAdd = () => {
  resetItemSkuList();
  skuLoading.value = true;
  dialog.visible = true;
  dialog.title = "新增商品";
  nextTick(async () => {
    reset();
    const _id = row?.itemId || ids.value[0];
    const res = await getItem(_id);
    Object.assign(skuForm.itemSkuList, res.data.sku);
    skuLoading.value = false;
    Object.assign(form.value, res.data);
  });
};

const handleQueryType = (node, data) => {
  queryParams.value.pageNum = 1;
  if (data.data.label === "全部") {
    queryParams.value.itemCategory = "";
    currentType.value = "";
    getList();
  } else {
    queryParams.value.itemCategory = data.data.id;
    currentType.value = data.data.id;
    getList();
  }
};

const submitCategoryForm = () => {
  itemCategoryFormRef.value.validate(async (valid) => {
    if (valid) {
      buttonLoading.value = true;
      if (categoryForm.value.id) {
        await updateItemCategory(categoryForm.value).finally(
          () => (buttonLoading.value = false)
        );
      } else {
        await addItemCategory(categoryForm.value).finally(
          () => (buttonLoading.value = false)
        );
      }
      proxy?.$modal.msgSuccess(categoryForm.value.id ? "修改成功" : "新增成功");
      categoryDialog.visible = false;
      Promise.all([
        useWmsStore().getItemCategoryList(),
        useWmsStore().getItemCategoryTreeList(),
      ]).then(() => getItemCategoryTreeSelect());
    }
  });
};

onMounted(() => {
  getItemCategoryTreeSelect();
  if (route.query.openDrawer) {
    handleAdd();
  }
});
</script>
<style>
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.el-tree-node__content {
  display: flex;
  align-items: center;
  height: 35px;
  cursor: pointer;
}

.el-table .my-cell {
  vertical-align: top;
}

.el-table__empty-text {
  width: 100%;
}
</style>
