import request from '@/utils/request'

// 查询资金明细表列表
export function listFinancial(query) {
  return request({
    url: '/wms/financial/list',
    method: 'get',
    params: query
  })
}

// 查询资金明细表详细
export function getFinancial(id) {
  return request({
    url: '/wms/financial/' + id,
    method: 'get'
  })
}

// 新增资金明细表
export function addFinancial(data) {
  return request({
    url: '/wms/financial',
    method: 'post',
    data: data
  })
}

// 修改资金明细表
export function updateFinancial(data) {
  return request({
    url: '/wms/financial',
    method: 'put',
    data: data
  })
}

// 删除资金明细表
export function delFinancial(id) {
  return request({
    url: '/wms/financial/' + id,
    method: 'delete'
  })
}

// 获取账户余额
export function getBalance(id) {
  return request({
    url: '/wms/balance/' + id,
    method: 'get'
  })
}

// 更新账户余额
export function updateBalance(data) {
  return request({
    url: '/wms/balance',
    method: 'put',
    data: data
  })
}

// 充值
export function recharge(data) {
  return request({
    url: '/wms/balance',
    method: 'put',
    data: data
  })
}