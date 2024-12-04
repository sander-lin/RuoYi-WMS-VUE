import { listWarehouseNoPage } from "@/api/wms/warehouse";
import { listAreaNoPage } from "@/api/wms/area";
import { listMerchantNoPage } from "@/api/wms/merchant";
import {
  listItemCategory,
  treeSelectItemCategory,
} from "@/api/wms/itemCategory";
import { listItemBrand } from "@/api/wms/itemBrand";
import { listChannel } from "@/api/wms/channel";
import { listUser } from "@/api/system/user";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useWmsStore = defineStore("wms", () => {
  // 仓库管理
  const warehouseList = ref([]);
  const warehouseMap = ref(new Map());

  const getWarehouseList = () => {
    listWarehouseNoPage({}).then((res) => {
      warehouseList.value = res.data;
      const map = new Map();
      warehouseList.value.forEach((supplier) => {
        map.set(supplier.id, supplier);
      });
      warehouseMap.value = map;
    });
  };
  // 库区管理
  const areaList = ref([]);
  const areaMap = ref(new Map());

  const getAreaList = () => {
    listAreaNoPage({}).then((res) => {
      areaList.value = res.data;
      const map = new Map();
      areaList.value.forEach((supplier) => {
        map.set(supplier.id, supplier);
      });
      areaMap.value = map;
    });
  };

  // 企业管理
  const merchantList = ref([]);
  const merchantMap = ref(new Map());

  const getMerchantList = () => {
    listMerchantNoPage({}).then((res) => {
      merchantList.value = res.data;
      const map = new Map();
      merchantList.value.forEach((supplier) => {
        map.set(supplier.id, supplier);
      });
      merchantMap.value = map;
    });
  };

  // 商品分类管理
  const itemCategoryList = ref([]);
  const itemCategoryTreeList = ref([]);
  const itemCategoryMap = ref(new Map());

  const getItemCategoryList = () => {
    return new Promise((resolve, reject) => {
      listItemCategory({})
        .then((res) => {
          itemCategoryList.value = res.data;
          const map = new Map();
          itemCategoryList.value.forEach((supplier) => {
            map.set(supplier.id, supplier);
          });
          itemCategoryMap.value = map;
          console.info("getItemCategoryList");
          resolve();
        })
        .catch(() => reject());
    });
  };

  const getItemCategoryTreeList = async () => {
    return new Promise((resolve, reject) => {
      treeSelectItemCategory()
        .then((res) => {
          itemCategoryTreeList.value = res.data;
          console.info("getItemCategoryTreeList");
          resolve();
        })
        .catch(() => reject());
    });
  };

  // 商品品牌管理
  const itemBrandList = ref([]);
  const itemBrandMap = ref(new Map());

  const getItemBrandList = () => {
    return new Promise((resolve, reject) => {
      listItemBrand({})
        .then((res) => {
          itemBrandList.value = res.data;
          const map = new Map();
          itemBrandList.value.forEach((supplier) => {
            map.set(supplier.id, { ...supplier });
          });
          itemBrandMap.value = map;
          console.info("itemBrandMap:", itemBrandMap.value);
          resolve();
        })
        .catch(() => reject());
    });
  };

  // 物流渠道管理
  const logisticsList = ref([]);
  const logisticsMap = ref(new Map());

  const getLogisticsList = () => {
    return new Promise((resolve, reject) => {
      listChannel({})
        .then((res) => {
          logisticsList.value = res.rows;
          const map = new Map();
          logisticsList.value.forEach((supplier) => {
            map.set(supplier.id, { ...supplier });
          });
          logisticsMap.value = map;
          resolve();
        })
        .catch(() => reject());
    });
  };

  // 人员管理
  const userList = ref([]);
  const userOptions = ref([]); // 人员下拉列表
  const userMap = ref(new Map());

  const getUserList = () => {
    return new Promise((resolve, reject) => {
      listUser({})
        .then((res) => {
          userList.value = res.rows;
          const map = new Map();
          userList.value.forEach((supplier) => {
            map.set(supplier.id, { ...supplier });
          });
          userOptions.value = userList.value.filter((item) => {
            return item.userId !== 1;
          }).map((item) => {
            return {
              label: item.userName,
              value: item.userId,
            };
          });
          userMap.value = map;
          resolve();
        })
        .catch(() => reject());
    });
  };
  // getUserList();
  // getLogisticsList();
  return {
    // 仓库管理
    warehouseList,
    warehouseMap,
    getWarehouseList,
    // 库区管理
    areaList,
    areaMap,
    getAreaList,
    // 企业管理
    merchantList,
    merchantMap,
    getMerchantList,
    // 商品分类管理
    itemCategoryList,
    itemCategoryTreeList,
    itemCategoryMap,
    getItemCategoryList,
    getItemCategoryTreeList,
    // 商品品牌管理
    itemBrandList,
    itemBrandMap,
    getItemBrandList,
    // 物流渠道管理
    logisticsList,
    logisticsMap,
    getLogisticsList,
    getUserList,
    userOptions,
    userMap,
    userList,
  };
});
