<template>
  <div class="app-container">
     <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
        <el-form-item label="搜索商品：" prop="postCode">
           <el-input
              v-model="queryParams.postCode"
              placeholder="输入FNSKU或商品名称进行搜索"
              clearable
              style="width: 250px"
              @keyup.enter="handleQuery"
           />
        </el-form-item>
        <el-form-item label="商品阶段：" prop="postName">
          <el-select v-model="queryParams.productStatus" placeholder="请选择" clearable style="width: 100px">
              <el-option
                 v-for="dict in wms_product_status"
                 :key="dict.value"
                 :label="dict.label"
                 :value="dict.value"
              />
           </el-select>
        </el-form-item>
        <el-form-item label="所属客户：" prop="status">
           <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 100px">
              <el-option
                 v-for="dict in sys_normal_disable"
                 :key="dict.value"
                 :label="dict.label"
                 :value="dict.value"
              />
           </el-select>
        </el-form-item>
        <el-form-item>
           <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
           <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
     </el-form>

     <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
           <el-button
              type="primary"
              plain
              icon="Plus"
              @click="handleAdd"
              v-hasPermi="['system:post:add']"
           >商品信息录入</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
     </el-row>

     <el-table v-loading="loading" :data="postList" >
        <el-table-column label="商品编号" align="center" prop="postId" />
        <el-table-column label="FNSKU" align="center" prop="postId" />
        <el-table-column label="ASIN" align="center" prop="postId" />
        <el-table-column label="商品名称" align="center" prop="postName" />
        <el-table-column label="商品图片" align="center" prop="postName" />
        <el-table-column label="尺寸" align="center" prop="postName" />
        <el-table-column label="颜色" align="center" prop="postName" />
        <el-table-column label="型号" align="center" prop="postName" />
        <el-table-column label="单价" align="center" prop="postName" />
        <el-table-column label="所属客户" align="center" prop="postCode" />
        <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
           <template #default="scope">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:post:edit']">修改</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:post:remove']">删除</el-button>
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

     <!-- 添加或修改岗位对话框 -->
     <el-dialog :title="title" v-model="open" width="500px" append-to-body>
        <el-form ref="postRef" :model="form" :rules="rules" label-width="100px">
           <el-form-item label="URL:" prop="postCode">
              <el-input v-model="form.postName" placeholder="请输入淘宝或阿里巴巴连接" />
           </el-form-item>
           <el-form-item label="商品型号：" prop="postName">
              <el-input v-model="form.postCode"/>
           </el-form-item>
           <el-form-item label="商品名称：" prop="postCode">
            <el-input v-model="form.postCode" />
           </el-form-item>
           <el-form-item label="商品颜色：" prop="postSort">
            <el-input v-model="form.postCode" />
           </el-form-item>
           <el-form-item label="商品尺寸：" prop="postSort">
            <el-input v-model="form.postCode" />
           </el-form-item>
           <el-form-item label="商品图片：" prop="postSort">
            <el-input v-model="form.postCode" />
           </el-form-item>
           <el-form-item label="单价：" prop="postSort">
            <el-input v-model="form.postCode" />
           </el-form-item>
           <el-form-item label="所属客户：" prop="postSort">
            <el-select v-model="queryParams.status" placeholder="选择客户" clearable style="width: 200px">
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
  </div>
</template>

<script setup name="Post">
import { listPost, addPost, delPost, getPost, updatePost } from "@/api/system/post";
import { listItemSkuPage, addItemSku, delItemSku, getItemSku, updateItemSku } from "@/api/wms/itemSku";
const { proxy } = getCurrentInstance();
const { wms_product_status } = proxy.useDict("wms_product_status");
const postList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const total = ref(0);
const title = ref("");

const data = reactive({
 form: {},
 queryParams: {
   pageNum: 1,
   pageSize: 10,
   postCode: undefined,
   postName: undefined,
   status: undefined,
   productStatus: undefined
 },
 rules: {
   postName: [{ required: true, message: "不能为空", trigger: "blur" }],
 }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询岗位列表 */
function getList() {
 loading.value = true;
 listPost(queryParams.value).then(response => {
   postList.value = response.rows;
   total.value = response.total;
   loading.value = false;
 });
}

/** 取消按钮 */
function cancel() {
 open.value = false;
 reset();
}

/** 表单重置 */
function reset() {
 form.value = {
   postId: undefined,
   postCode: undefined,
   postName: undefined,
   postSort: 0,
   status: "0",
   remark: undefined
 };
 proxy.resetForm("postRef");
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

// /** 多选框选中数据 */
// function handleSelectionChange(selection) {
//  ids.value = selection.map(item => item.postId);
//  single.value = selection.length != 1;
//  multiple.value = !selection.length;
// }

/** 新增按钮操作 */
function handleAdd() {
 reset();
 open.value = true;
 title.value = "添加商品";
}

/** 修改按钮操作 */
function handleUpdate(row) {
 reset();
 const postId = row.postId || ids.value;
 getPost(postId).then(response => {
   form.value = response.data;
   open.value = true;
   title.value = "修改商品";
 });
}

/** 提交按钮 */
function submitForm() {
 proxy.$refs["postRef"].validate(valid => {
   if (valid) {
     if (form.value.postId != undefined) {
       updatePost(form.value).then(response => {
         proxy.$modal.msgSuccess("修改成功");
         open.value = false;
         getList();
       });
     } else {
       addPost(form.value).then(response => {
         proxy.$modal.msgSuccess("新增成功");
         open.value = false;
         getList();
       });
     }
   }
 });
}

/** 删除按钮操作 */
function handleDelete(row) {
 const postIds = row.postId || ids.value;
 proxy.$modal.confirm('是否确认删除商品编号为"' + postIds + '"的数据项？').then(function() {
   return delPost(postIds);
 }).then(() => {
   getList();
   proxy.$modal.msgSuccess("删除成功");
 }).catch(() => {});
}

getList();
</script>
