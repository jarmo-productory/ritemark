/**
 * Widget Registry
 *
 * Central registry for all widget plugins.
 * Maps OpenAI tool names to widget factories.
 */

import type { WidgetPlugin, WidgetMetadata, WidgetFactory } from './types'

/**
 * Global widget registry
 * Singleton pattern for managing widget plugins
 */
class WidgetRegistry {
  private plugins = new Map<string, WidgetPlugin>()

  /**
   * Register a widget plugin
   */
  register(plugin: WidgetPlugin): void {
    if (this.plugins.has(plugin.metadata.id)) {
      console.warn(`[WidgetRegistry] Plugin '${plugin.metadata.id}' already registered, overwriting`)
    }
    this.plugins.set(plugin.metadata.id, plugin)
    console.log(`[WidgetRegistry] Registered plugin: ${plugin.metadata.id} (tool: ${plugin.metadata.toolName})`)
  }

  /**
   * Unregister a widget plugin
   */
  unregister(id: string): boolean {
    const result = this.plugins.delete(id)
    if (result) {
      console.log(`[WidgetRegistry] Unregistered plugin: ${id}`)
    }
    return result
  }

  /**
   * Get plugin by ID
   */
  getById(id: string): WidgetPlugin | undefined {
    return this.plugins.get(id)
  }

  /**
   * Find plugin by OpenAI tool name
   */
  findByToolName(toolName: string): WidgetPlugin | undefined {
    for (const plugin of this.plugins.values()) {
      if (plugin.metadata.toolName === toolName) {
        return plugin
      }
    }
    return undefined
  }

  /**
   * Get all registered plugins
   */
  getAll(): WidgetPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get all plugin metadata
   */
  getAllMetadata(): WidgetMetadata[] {
    return Array.from(this.plugins.values()).map((p) => p.metadata)
  }

  /**
   * Check if a plugin is registered
   */
  has(id: string): boolean {
    return this.plugins.has(id)
  }

  /**
   * Check if a tool name has a widget
   */
  hasToolWidget(toolName: string): boolean {
    return this.findByToolName(toolName) !== undefined
  }

  /**
   * Clear all plugins (for testing)
   */
  clear(): void {
    this.plugins.clear()
    console.log('[WidgetRegistry] Cleared all plugins')
  }
}

// Export singleton instance
export const widgetRegistry = new WidgetRegistry()
