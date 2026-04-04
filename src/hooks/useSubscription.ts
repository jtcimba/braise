import Purchases from 'react-native-purchases';
import {useState, useEffect} from 'react';

export const useSubscription = () => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkEntitlement = async () => {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPro(!!customerInfo.entitlements.active.pro);
      setIsLoading(false);
    };

    checkEntitlement();

    const listener = Purchases.addCustomerInfoUpdateListener(info => {
      setIsPro(!!info.entitlements.active.pro);
    });

    return listener;
  }, []);

  return {isPro, isLoading};
};
