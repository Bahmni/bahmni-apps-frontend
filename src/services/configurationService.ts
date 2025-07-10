// import { get } from './api';
// import { GLOBAL_PROPERTY_URL } from '@constants/app';
// import { AUDIT_LOG_GLOBAL_PROPERTY } from '@constants/auditLog';

// interface GlobalProperty {
//   property: string;
//   value: string;
// }

// interface ConfigurationResponse {
//   enableAuditLog?: boolean;
//   [key: string]: any;
// }

// /**
//  * Service to fetch global properties from OpenMRS
//  */
// class ConfigurationService {
//   private configCache: Map<string, any> = new Map();

//   /**
//    * Get global property value
//    * @param property - The global property name
//    * @returns Promise<string | null>
//    */
//   async getGlobalProperty(property: string): Promise<string | null> {
//     try {
//       if (this.configCache.has(property)) {
//         return this.configCache.get(property);
//       }

//       const response = await get<GlobalProperty>(
//         `${GLOBAL_PROPERTY_URL}?property=${encodeURIComponent(property)}`
//       );
      
//       const value = response?.value || null;
//       this.configCache.set(property, value);
//       return value;
//     } catch (error) {
//       console.error(`Failed to fetch global property ${property}:`, error);
//       return null;
//     }
//   }

//   /**
//    * Get multiple configurations
//    * @param configNames - Array of configuration names to fetch
//    * @returns Promise<ConfigurationResponse>
//    */
//   async getConfigurations(configNames: string[]): Promise<ConfigurationResponse> {
//     const configurations: ConfigurationResponse = {};

//     try {
//       const promises = configNames.map(async (configName) => {
//         if (configName === 'enableAuditLog') {
//           const value = await this.getGlobalProperty(AUDIT_LOG_GLOBAL_PROPERTY);
//           return { key: configName, value: value === 'true' };
//         }
//         return { key: configName, value: null };
//       });

//       const results = await Promise.all(promises);
      
//       results.forEach(({ key, value }) => {
//         configurations[key] = value;
//       });

//       return configurations;
//     } catch (error) {
//       console.error('Failed to fetch configurations:', error);
//       return configurations;
//     }
//   }

//   /**
//    * Check if audit logging is enabled
//    * @returns Promise<boolean>
//    */
//   async isAuditLogEnabled(): Promise<boolean> {
//     try {
//       const value = await this.getGlobalProperty(AUDIT_LOG_GLOBAL_PROPERTY);
//       return value === 'true';
//     } catch (error) {
//       console.error('Failed to check audit log status:', error);
//       return false;
//     }
//   }

//   /**
//    * Clear configuration cache
//    */
//   clearCache(): void {
//     this.configCache.clear();
//   }
// }

// export const configurationService = new ConfigurationService();