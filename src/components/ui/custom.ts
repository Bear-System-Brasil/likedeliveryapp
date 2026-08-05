/**
 * Reusable UI Components
 *
 * This file exports all custom UI components for easy importing throughout the application.
 * These components provide consistent styling, behavior, and patterns across pages.
 */

// Gradient Button - Themed button with orange-orange gradient
export {
  GradientButton,
  GradientIconButton,
  type GradientButtonProps,
} from "./gradient-button";

// Animated Background - Decorative background with animated blobs
export {
  AnimatedBackground,
  PageWithAnimatedBackground,
  type AnimatedBackgroundProps,
} from "./animated-background";

// Glass Card - Card with glassmorphism effect
export {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
  type GlassCardProps,
} from "./glass-card";

// Address Card - Reusable address display card
export {
  AddressCard,
  AddressList,
  type Address,
  type AddressCardProps,
  type AddressListProps,
} from "./address-card";

// Address Form Fields - Reusable address form inputs
export {
  AddressFormFields,
  useAddressForm,
  type AddressFormData,
  type AddressFormFieldsProps,
} from "./address-form-fields";

// Page Section - Reusable page section with header and content
export {
  PageHeader,
  PageSection,
  SectionCard,
  type PageHeaderProps,
  type PageSectionProps,
  type SectionCardProps,
} from "./page-section";

/**
 * Usage Examples:
 *
 * @example GradientButton
 * ```tsx
 * import { GradientButton } from '@/components/ui/custom'
 *
 * <GradientButton onClick={handleClick} isLoading={loading}>
 *   Submit
 * </GradientButton>
 * ```
 *
 * @example AnimatedBackground
 * ```tsx
 * import { PageWithAnimatedBackground } from '@/components/ui/custom'
 *
 * <PageWithAnimatedBackground>
 *   <YourContent />
 * </PageWithAnimatedBackground>
 * ```
 *
 * @example GlassCard
 * ```tsx
 * import { GlassCard, GlassCardContent } from '@/components/ui/custom'
 *
 * <GlassCard variant="glass" shadow="lg" hoverable>
 *   <GlassCardContent>
 *     <p>Content</p>
 *   </GlassCardContent>
 * </GlassCard>
 * ```
 *
 * @example AddressCard
 * ```tsx
 * import { AddressList } from '@/components/ui/custom'
 *
 * <AddressList
 *   addresses={addresses}
 *   selectedId={selectedId}
 *   selectable
 *   onSelect={handleSelect}
 * />
 * ```
 *
 * @example PageSection
 * ```tsx
 * import { PageHeader, PageSection } from '@/components/ui/custom'
 *
 * <PageHeader
 *   title="My Page"
 *   subtitle="Page description"
 *   action={<Button>Action</Button>}
 * />
 *
 * <PageSection title="Section" loading={loading}>
 *   <Content />
 * </PageSection>
 * ```
 */
