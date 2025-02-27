import request from '@/utils/request'

// 查询商品库存表列表
export function listInventories(query) {
  return request({
    url: '/wms/inventories/lists',
    method: 'get',
    params: query
  })
}

// 获取可添加的库存商品信息
export function addableInventoryMerchandise(query) {
  return request({
    url: '/wms/merchandise/getAddableInventoryMerchandise',
    method: 'get',
    params: query
  })
}

// 查询商品库存表详细
export function getInventories(id) {
  return request({
    url: '/wms/inventories/' + id,
    method: 'get'
  })
}

// 新增商品库存表
export function addInventories(data) {
  return request({
    url: '/wms/inventories',
    method: 'post',
    data: data
  })
}

// 批量入库
export function batchAddInventories(data) {
  return request({
    url: '/wms/inventories/batchInsert',
    method: 'post',
    data: data
  })
}

// 修改商品库存表
export function updateInventories(data) {
  return request({
    url: '/wms/inventories',
    method: 'put',
    data: data
  })
}

// 删除商品库存表
export function delInventories(id) {
  return request({
    url: '/wms/inventories/' + id,
    method: 'delete'
  })
}
