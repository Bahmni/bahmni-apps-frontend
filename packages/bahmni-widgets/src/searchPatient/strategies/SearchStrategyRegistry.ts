import { SearchStrategy, PatientSearchType } from '../SearchStrategy.interface';
import { AppointmentSearchStrategy } from './AppointmentSearchStrategy';
import { AttributeSearchStrategy } from './AttributeSearchStrategy';
import { NameOrIdSearchStrategy } from './NameOrIdSearchStrategy';

/**
 * Registry for managing patient search strategies.
 * Implements the Strategy Pattern to allow dynamic selection of search algorithms.
 */
export class SearchStrategyRegistry {
  private strategies = new Map<PatientSearchType, SearchStrategy>();

  /**
   * Register a search strategy
   * @param strategy - The strategy to register
   */
  register(strategy: SearchStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  /**
   * Get a search strategy by type
   * @param type - The type of search strategy to retrieve
   * @returns The requested search strategy
   * @throws Error if no strategy is registered for the given type
   */
  getStrategy(type: PatientSearchType): SearchStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`No search strategy registered for type: ${type}`);
    }
    return strategy;
  }

  /**
   * Check if a strategy is registered for a given type
   * @param type - The type to check
   * @returns true if a strategy is registered, false otherwise
   */
  hasStrategy(type: PatientSearchType): boolean {
    return this.strategies.has(type);
  }

  /**
   * Get all registered strategy types
   * @returns Array of registered strategy types
   */
  getRegisteredTypes(): PatientSearchType[] {
    return Array.from(this.strategies.keys());
  }
}

/**
 * Singleton instance of the search strategy registry with all strategies pre-registered
 */
export const searchStrategyRegistry = new SearchStrategyRegistry();

// Register all available strategies
searchStrategyRegistry.register(new NameOrIdSearchStrategy());
searchStrategyRegistry.register(new AttributeSearchStrategy());
searchStrategyRegistry.register(new AppointmentSearchStrategy());

// Export the singleton instance as default
export default searchStrategyRegistry;
