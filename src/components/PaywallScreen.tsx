import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FEATURES = [
  {
    title: 'Add recipes from anywhere',
    description:
      'Import recipes from your browser, a photo, or write one from scratch',
  },
  {
    title: 'Create grocery lists',
    description:
      'Add recipe ingredients in seconds and sort by aisle, recipe, or checked off',
  },
  {
    title: "Never wonder what's for dinner again",
    description: 'All your recipes, organized in one beautiful place',
  },
];

const PRO_ENTITLEMENT = 'pro';
const TERMS_URL = 'https://example.com/terms';
const PRIVACY_URL = 'https://example.com/privacy';

type PlanType = 'monthly' | 'annual';

export default function PaywallScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const theme = useTheme() as unknown as Theme;
  const dismissible = route.params?.dismissible ?? true;
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(
    null,
  );
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const purchaseSucceededRef = useRef(false);

  useEffect(() => {
    if (!dismissible) {
      const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
        if (!purchaseSucceededRef.current) {
          e.preventDefault();
        }
      });
      return unsubscribe;
    }
  }, [dismissible, navigation]);

  useEffect(() => {
    async function fetchOfferings() {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          const packages = offerings.current.availablePackages;
          setMonthlyPackage(
            packages.find(p => p.packageType === 'MONTHLY') ?? null,
          );
          setAnnualPackage(
            packages.find(p => p.packageType === 'ANNUAL') ?? null,
          );
        }

        const customerInfo = await Purchases.getCustomerInfo();
        setHasUsedTrial(!!customerInfo.entitlements.all[PRO_ENTITLEMENT]);
      } catch (error) {
        console.error('Failed to fetch offerings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOfferings();
  }, []);

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
    if (!pkg) {
      return;
    }

    setIsPurchasing(true);
    try {
      const {customerInfo} = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active[PRO_ENTITLEMENT]) {
        purchaseSucceededRef.current = true;
        navigation.goBack();
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase failed', 'Please try again later.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const customerInfo: CustomerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[PRO_ENTITLEMENT]) {
        purchaseSucceededRef.current = true;
        navigation.goBack();
      } else {
        Alert.alert(
          'No purchases found',
          'We could not find any previous purchases to restore.',
        );
      }
    } catch (error) {
      Alert.alert('Restore failed', 'Please try again later.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const getMonthlyEquivalent = () => {
    if (!annualPackage) {
      return '';
    }
    const monthly = annualPackage.product.price / 12;
    const symbol = annualPackage.product.priceString.replace(/[\d.,\s]/g, '');
    return `${symbol}${Math.round(monthly)}`;
  };

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      {dismissible && (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.closeButton}>
          <Ionicons
            name="close-outline"
            size={28}
            color={theme.colors['neutral-800']}
          />
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors['neutral-400']} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}>
          <View style={s.topSection}>
            <Text style={s.logo}>braise</Text>
            <Text style={s.tagline}>Cooking. Made simple.</Text>

            <View style={s.features}>
              {FEATURES.map(feature => (
                <View key={feature.title} style={s.featureBlock}>
                  <Text style={s.featureTitle}>{feature.title}</Text>
                  <Text style={s.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.bottomSection}>
            <View style={s.divider} />

            {!hasUsedTrial && (
              <Text style={s.trialText}>
                <Text style={s.trialBold}>7 days free</Text>
                {
                  " \u2014 cancel anytime before your trial ends and you won't be charged"
                }
              </Text>
            )}

            <View style={s.plans}>
              {monthlyPackage && (
                <TouchableOpacity
                  style={[
                    s.planCard,
                    selectedPlan === 'monthly' && s.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan('monthly')}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      s.planTitle,
                      selectedPlan === 'monthly' && s.planTitleSelected,
                    ]}>
                    Monthly
                  </Text>
                  <View style={s.planPriceContainer}>
                    <Text style={s.planPriceRow}>
                      <Text
                        style={[
                          s.planPriceBold,
                          selectedPlan === 'monthly' && s.planPriceBoldSelected,
                        ]}>
                        {monthlyPackage.product.priceString}
                      </Text>
                      <Text
                        style={[
                          s.planPriceUnit,
                          selectedPlan === 'monthly' && s.planPriceUnitSelected,
                        ]}>
                        {' '}
                        /month
                      </Text>
                    </Text>
                    <Text style={s.planSubtitle}>every four weeks</Text>
                  </View>
                </TouchableOpacity>
              )}

              {annualPackage && (
                <TouchableOpacity
                  style={[
                    s.planCard,
                    selectedPlan === 'annual' && s.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan('annual')}
                  activeOpacity={0.7}>
                  <View style={s.planTitleRow}>
                    <Text
                      style={[
                        s.planTitle,
                        selectedPlan === 'annual' && s.planTitleSelected,
                      ]}>
                      Annual
                    </Text>
                    <View style={s.saveBadge}>
                      <Text style={s.saveBadgeText}>Best value</Text>
                    </View>
                  </View>
                  <View style={s.planPriceContainer}>
                    <Text style={s.planPriceRow}>
                      <Text
                        style={[
                          s.planPriceBold,
                          selectedPlan === 'annual' && s.planPriceBoldSelected,
                        ]}>
                        {getMonthlyEquivalent()}
                      </Text>
                      <Text
                        style={[
                          s.planPriceUnit,
                          selectedPlan === 'annual' && s.planPriceUnitSelected,
                        ]}>
                        {' '}
                        /month
                      </Text>
                    </Text>
                    <Text style={s.planSubtitle}>
                      {annualPackage.product.priceString} annually
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={s.ctaButton}
              onPress={handlePurchase}
              disabled={isPurchasing}
              activeOpacity={0.8}>
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.ctaText}>
                  {hasUsedTrial ? 'Subscribe' : 'Start Free Trial'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={s.legalText}>
              {'By subscribing you agree to our '}
              <Text
                style={s.legalLink}
                onPress={() => Linking.openURL(TERMS_URL)}>
                Terms and service
              </Text>
              {' and '}
              <Text
                style={s.legalLink}
                onPress={() => Linking.openURL(PRIVACY_URL)}>
                Privacy Policy
              </Text>
            </Text>

            <TouchableOpacity onPress={handleRestore} style={s.restoreButton}>
              <Text style={s.restoreText}>Restore purchases</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors['neutral-100'],
    },
    closeButton: {
      position: 'absolute',
      top: 56,
      right: 16,
      zIndex: 1,
      padding: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'space-between',
      paddingHorizontal: 24,
    },
    topSection: {
      alignItems: 'center',
      paddingTop: 32,
    },
    logo: {
      fontFamily: 'Noto Serif',
      fontSize: 52,
      fontWeight: '400',
      color: theme.colors['neutral-800'],
    },
    tagline: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['rust-600'],
      marginBottom: 32,
    },
    features: {
      alignSelf: 'stretch',
      gap: 24,
    },
    featureBlock: {
      gap: 4,
    },
    featureTitle: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
    },
    featureDescription: {
      ...theme.typography.h3,
      color: theme.colors['neutral-400'],
      lineHeight: 21,
    },
    bottomSection: {
      paddingBottom: 16,
      paddingTop: 16,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors['neutral-300'],
      width: '40%',
      alignSelf: 'center',
      marginBottom: 20,
    },
    trialText: {
      ...theme.typography.h3,
      color: theme.colors['neutral-400'],
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: 20,
    },
    trialBold: {
      ...theme.typography['h3-emphasized'],
      color: theme.colors['rust-600'],
    },
    plans: {
      gap: 12,
      marginBottom: 20,
    },
    planCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    planCardSelected: {
      borderColor: theme.colors['rust-600'],
      borderWidth: 2,
    },
    planTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    planTitle: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-400'],
    },
    planTitleSelected: {
      color: theme.colors['neutral-800'],
    },
    saveBadge: {
      backgroundColor: theme.colors['rust-200'],
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    saveBadgeText: {
      fontFamily: 'Switzer',
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors['neutral-800'],
    },
    planPriceContainer: {
      alignItems: 'flex-end',
    },
    planPriceRow: {},
    planPriceBold: {
      fontFamily: 'Switzer',
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors['neutral-400'],
    },
    planPriceBoldSelected: {
      color: theme.colors['neutral-800'],
    },
    planPriceUnit: {
      ...theme.typography.h3,
      color: theme.colors['neutral-400'],
    },
    planPriceUnitSelected: {
      color: theme.colors['neutral-800'],
    },
    planSubtitle: {
      ...theme.typography.h4,
      color: theme.colors['neutral-400'],
      marginTop: 2,
    },
    ctaButton: {
      backgroundColor: theme.colors['neutral-800'],
      paddingVertical: 16,
      borderRadius: 25,
      alignItems: 'center',
      marginBottom: 20,
    },
    ctaText: {
      fontFamily: 'Switzer',
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    legalText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-400'],
      textAlign: 'center',
      lineHeight: 20,
    },
    legalLink: {
      ...theme.typography['h4-emphasized'],
      color: theme.colors['rust-600'],
    },
    restoreButton: {
      alignSelf: 'center',
      marginTop: 16,
      padding: 4,
    },
    restoreText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-400'],
      textDecorationLine: 'underline',
    },
  });
