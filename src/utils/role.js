import useUserStore from '@/store/modules/user'
export const isBuyer = () => {
    return useUserStore().roles.includes('buyer')
}