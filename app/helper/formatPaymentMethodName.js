export const formatPaymentMethodName = (method) => {
  return method.replace(/([A-Z])/g, ' $1').trim().replace('pay On Collection', 'Pay on Collection');
};
