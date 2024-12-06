<template>
  <div class="app-container">
    <el-card>
      <el-form
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="商品编号" prop="itemCode">
          <el-input
            v-model="queryParams.itemCode"
            placeholder="请输入商品编号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="商品名称" prop="itemName">
          <el-input
            v-model="queryParams.itemName"
            placeholder="请输入商品名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="商品品牌" prop="itemBrand">
          <el-select v-model="queryParams.itemBrand" clearable filterable>
            <el-option
              v-for="item in useWmsStore().itemBrandList"
              :key="item.id"
              :label="item.brandName"
              :value="item.id"
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
      <div style="display: flex; align-items: start">
        <div style="width: 100%; position: relative">
          <div
            style="
              display: flex;
              align-items: start;
              justify-content: space-between;
            "
          >
            <span class="mr10" style="font-size: 18px">商品列表</span>
            <el-button
              type="primary"
              plain
              icon="Plus"
              @click="handleAdd"
              class="mb10"
              >新增商品</el-button
            >
          </div>
          <el-table
            :data="itemList"
            @selection-change="handleSelectionChange"
            :span-method="spanMethod"
            border
            empty-text="暂无商品"
            v-loading="loading"
            cell-class-name="my-cell"
          >
            <el-table-column label="商品编号" align="center" prop="id" />
            <el-table-column label="FNSKU" align="center" prop="skuCode" />
            <el-table-column label="ASIN" align="center" prop="barcode" />
            <el-table-column label="商品名称" align="center" prop="itemName" />
            <el-table-column label="商品图片" align="center" prop="photos">
              <template #default="scope">
                <el-image
                  :src="scope.row.photos[0]"
                  style="width: 50px; height: 50px"
                ></el-image>
              </template>
            </el-table-column>
            <el-table-column label="尺寸" align="center" prop="skuName" />
            <el-table-column label="颜色" align="center" prop="color" />
            <el-table-column label="型号" align="center" prop="itemBrand" />
            <el-table-column label="单价" align="center" prop="sellingPrice" />
            <el-table-column label="所属客户" align="center" prop="belongTo" />
            <el-table-column
              label="操作"
              width="180"
              align="center"
              class-name="small-padding fixed-width"
            >
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  icon="Edit"
                  @click="handleUpdate(scope.row)"
                  v-hasPermi="['system:post:edit']"
                  >修改</el-button
                >
                <el-button
                  link
                  type="danger"
                  icon="Delete"
                  @click="handleDelete(scope.row)"
                  v-hasPermi="['system:post:remove']"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="total > 0"
            :total="total"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </div>
    </el-card>
    <!-- 添加或修改物料对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="500px"
      append-to-body
    >
      <el-form
        ref="itemFormRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="URL:" prop="itemLink">
          <el-input
            v-model="form.itemLink"
            placeholder="请输入淘宝或阿里巴巴连接"
          />
        </el-form-item>
        <el-form-item label="商品型号：" prop="itemBrand">
          <el-input v-model="form.itemBrand" />
        </el-form-item>
        <el-form-item label="商品名称：" prop="itemName">
          <el-input v-model="form.itemName" />
        </el-form-item>
        <el-form-item label="商品颜色：" prop="color">
          <el-input v-model="form.color" />
        </el-form-item>
        <el-form-item label="商品尺寸：" prop="size">
          <el-input v-model="form.size" />
        </el-form-item>
        <el-form-item label="商品图片：" prop="photos">
          <el-input v-model="form.photos" />
        </el-form-item>
        <el-form-item label="单价：" prop="sellingPrice">
          <el-input-number v-model="form.sellingPrice" min="0" />
        </el-form-item>
        <el-form-item label="所属客户：" prop="belongTo">
          <el-select
            v-model="queryParams.status"
            placeholder="选择客户"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="dict in sys_normal_disable"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
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
const initFormData = {
  id: undefined,
  itemName: undefined,
  itemLink: "",
  itemBrand: "",
  itemCategory: "1829397958923841538",
  color: "",
  size: "",
  photos: [],
  sellingPrice: null,
  belongTo: undefined,
};
const initCategoryFormData = {
  id: undefined,
  parentId: undefined,
  ancestors: undefined,
  categoryName: undefined,
  orderNum: 0,
  status: undefined,
};
const data = reactive({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemCode: undefined,
    itemName: undefined,
    itemType: undefined,
  },
  rules: {
    id: [{ required: true, message: "不能为空", trigger: "blur" }],
    itemName: [{ required: true, message: "名称不能为空", trigger: "blur" }],
    // itemCategory: [
    //   { required: true, message: "分类不能为空", trigger: "blur" },
    // ],
    // rackId: [{ required: true, message: "所属货架不能为空", trigger: "blur" }],
    // areaId: [{ required: true, message: "所属库区不能为空", trigger: "blur" }],
    // warehouseId: [
    //   { required: true, message: "所属仓库不能为空", trigger: "blur" },
    // ],
    // quantity: [
    //   { required: true, message: "安全库存不能为空", trigger: "blur" },
    // ],
    // remark: [{ required: true, message: "备注不能为空", trigger: "blur" }],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询物料列表 */
const getList = async () => {
  loading.value = true;
  const res = await listItemSkuPage(queryParams.value);
  itemList.value = res.rows.map((item) => {
    return {
      ...item,
      ...item.item,
      size:
        (item.length || "") +
        "*" +
        (item.width || "") +
        "*" +
        (item.height || ""),
      photos: [
        "https://cdn.pixabay.com/photo/2023/09/11/14/19/weight-8246973_1280.jpg",
      ],
      color:
        "rgb(" +
        Math.floor(Math.random() * 255) +
        "," +
        Math.floor(Math.random() * 255) +
        "," +
        Math.floor(Math.random() * 255) +
        ")",
      belongTo: "admin",
    };
  });
  total.value = res.total;
  loading.value = false;
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

const onAppendBtnClick = () => {
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
const handleDeleteItemSku = async (row, index) => {
  if (!row.id) {
    skuForm.itemSkuList.splice(index, 1);
    return;
  }
  if (skuForm.itemSkuList.length === 1) {
    return proxy?.$modal.msgError("至少包含一个商品规格");
  }
  await proxy?.$modal.confirm("确认删除规格【" + row.skuName + "】吗？");
  try {
    await delItemSku(row.id);
  } catch (e) {
    if (e === 409) {
      return ElMessageBox.alert(
        "<div>规格【" +
          row.skuName +
          "】已有业务数据关联，不能删除 ！</div><div>请联系管理员处理！</div>",
        "系统提示",
        {
          dangerouslyUseHTMLString: true,
        }
      );
    }
  }
  proxy?.$modal.msgSuccess("删除成功");
  const res = await getItem(row.itemId);
  skuForm.itemSkuList = res.data.sku;
  form.value = res.data;
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
/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
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

/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
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
/** 修改按钮操作 */
const handleUpdate = (row) => {
  resetItemSkuList();
  skuLoading.value = true;
  dialog.visible = true;
  dialog.title = "修改商品";
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
/** 提交按钮 */
const submitForm = () => {
  form.value.sku = skuForm.itemSkuList;
  itemFormRef.value.validate(async (valid) => {
    if (valid) {
      let flag = true;
      if (!skuForm.itemSkuList || skuForm.itemSkuList.length === 0) {
        proxy?.$modal.msgError("至少包含一个商品规格");
        flag = false;
      }
      if (flag) {
        buttonLoading.value = true;
        if (form.value.id) {
          await updateItem(form.value).finally(
            () => (buttonLoading.value = false)
          );
        } else {
          await addItem(form.value).finally(
            () => (buttonLoading.value = false)
          );
        }
        proxy?.$modal.msgSuccess(form.value.id ? "修改成功" : "添加成功");
        dialog.visible = false;
        await getList();
      }
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row) => {
  const _ids = row?.itemId || ids.value;
  await proxy?.$modal.confirm("确认删除商品【" + row?.itemName + "】吗？");
  try {
    await delItem(_ids);
  } catch (e) {
    if (e === 409) {
      return ElMessageBox.alert(
        "<div>商品【" +
          row.itemName +
          "】已有业务数据关联，不能删除 ！</div><div>请联系管理员处理！</div>",
        "系统提示",
        {
          dangerouslyUseHTMLString: true,
        }
      );
    }
  }
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
};
const treeRef = ref(null);
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    "wms/item/export",
    {
      ...queryParams.value,
    },
    `item_${new Date().getTime()}.xlsx`
  );
};
/** 下载条形码 */
const downloadBarcode = (row) => {
  JSBarcode(barcode.value, row.barcode, {
    format: "CODE128",
    displayValue: true,
  });
  const canvas = barcode.value;
  //创建a标签
  let a = document.createElement("a");
  //设置下载文件的名字
  a.download = row.barcode;
  a.href = canvas.toDataURL("image/png");
  a.click();
};
/** 下载二维码 */
const downloadQrcode = async (row) => {
  qrcode.value = await Qrcode.toDataURL(row.barcode);
  //创建a标签
  let a = document.createElement("a");
  //获取二维码的url并赋值为a.href
  a.href = qrcode.value;
  //设置下载文件的名字
  a.download = row.barcode;
  //点击事件，相当于下载
  a.click();
  //提示信息
  // this.$message.warn('下载中，请稍后...')
};
const getVolumeText = (row) => {
  if (
    (row.length || row.length === 0) &&
    (row.width || row.width === 0) &&
    (row.height || row.height === 0)
  ) {
    return row.length + " * " + row.width + " * " + row.height;
  }
  return (
    (row.length || row.length === 0 ? "长：" + row.length : "") +
    (row.width || row.width === 0 ? " 宽：" + row.width : "") +
    (row.height || row.height === 0 ? " 高：" + row.height : "")
  );
};
onMounted(() => {
  getList();
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
