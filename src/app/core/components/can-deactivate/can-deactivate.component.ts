export interface CanDeactivateComponent {
  canDeactivate: () => Promise<boolean>;
}
