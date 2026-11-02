import { Fragment, isVNode } from 'vue'
import type { Component } from 'vue'

/**
 * Whether slotted content holds a tab with a route. It is read from the slot's
 * vnodes in the render of `<MTabs>`, before the tabs mount: the server has to
 * render a `<nav>` or a tablist from the first paint, and the tabs register
 * only after that decision.
 */
export function hasRouteTab(nodes: unknown, tab: Component): boolean {
  if (!Array.isArray(nodes)) return false

  return nodes.some((node) => {
    if (!isVNode(node)) return false
    if (node.type === Fragment) return hasRouteTab(node.children, tab)

    return node.type === tab && (node.props as Record<string, unknown> | null)?.to != null
  })
}
