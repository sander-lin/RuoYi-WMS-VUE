import { computed } from "vue"
import { useDict } from '@/utils/dict'


const { label_type, order_option, order_status, order_type, shipping_status, shipping_notice_status } =
  useDict(
    "label_type",
    "order_option",
    "order_status",
    "order_type",
    "shipping_status",
    "shipping_notice_status"
  );

/**
 * @type {import('./types').NoticeStatus}
 */
const noticeStatusMap = computed(() => {
  const res = {};
  shipping_notice_status.value.forEach((item) => {
    res[item.name] = item.value;
  });
  return res;
});

/**
 * @type {import('./types').ShippingStatus}
 */
const shippingStatusMap = computed(() => {
  const res = {};
  shipping_status.value.forEach((item) => {
    res[item.name] = item.value;
  });
  return res;
});

/**
 * @type {import('./types').OrderStatus}
 */
const orderStatusMap = computed(() => {
  const res = {};
  order_status.value.forEach((item) => {
    res[item.name] = item.value;
  });
  return res;
});

export default {
  label_type,
  order_option,
  order_status,
  order_type,
  shipping_status,
  shipping_notice_status,
  noticeStatusMap,
  shippingStatusMap,
  orderStatusMap
};