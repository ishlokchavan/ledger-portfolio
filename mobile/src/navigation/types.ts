import type { NavigatorScreenParams } from '@react-navigation/native';

export type PropertiesStackParamList = {
  PropertiesList: undefined;
  PropertyDetail: { propertyId: string };
};

export type RootTabParamList = {
  Overview: undefined;
  Properties: NavigatorScreenParams<PropertiesStackParamList>;
  Payments: undefined;
  Account: undefined;
};
