<template>
  <NuxtLayout name="primetime">
    <template #header>
      <div class="demo-primetime__header">
        <div class="demo-primetime__brand">
          <m-icon :name="ICONS.rocketLaunch" />
          <span class="demo-primetime__brand-text">PrimeTime</span>
        </div>

        <nav class="demo-primetime__nav">
          <a
            v-for="link in navLinks"
            :key="link.id"
            class="demo-primetime__nav-link"
            :class="{ 'demo-primetime__nav-link--active': activeLink === link.id }"
            href="#"
            @click.prevent="activeLink = link.id"
          >
            {{ link.label }}
          </a>
        </nav>

        <div class="demo-primetime__header-actions">
          <m-search
            v-model="searchQuery"
            placeholder="Search..."
            class="demo-primetime__search"
          />
          <m-button
            variant="text"
            class="demo-primetime__menu-btn"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <m-icon :name="mobileMenuOpen ? ICONS.close : ICONS.menu" />
          </m-button>
        </div>

        <!-- Mobile dropdown nav -->
        <nav
          v-if="mobileMenuOpen && isMobile"
          class="demo-primetime__mobile-nav"
        >
          <a
            v-for="link in navLinks"
            :key="link.id"
            class="demo-primetime__mobile-nav-link"
            href="#"
            @click.prevent="activeLink = link.id; mobileMenuOpen = false"
          >
            {{ link.label }}
          </a>
        </nav>
      </div>
    </template>

    <div class="demo-primetime__content">
      <!-- Hero Section -->
      <section class="demo-primetime__hero">
        <div class="demo-primetime__hero-inner">
          <h1 class="demo-primetime__hero-title">
            Build the future<br>of digital experiences
          </h1>
          <p class="demo-primetime__hero-subtitle">
            PrimeTime empowers teams to create stunning, performant, and accessible digital products
            with the power of modern design systems and cutting-edge technology.
          </p>
          <div class="demo-primetime__hero-actions">
            <m-button
              variant="filled"
              color="primary"
            >
              <m-icon :name="ICONS.rocketLaunch" />
              Start Building
            </m-button>
            <m-button variant="outlined">
              View Documentation
            </m-button>
          </div>

          <div class="demo-primetime__hero-stats">
            <div
              v-for="stat in heroStats"
              :key="stat.label"
              class="demo-primetime__stat"
            >
              <span class="demo-primetime__stat-value">{{ stat.value }}</span>
              <span class="demo-primetime__stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Grid -->
      <section class="demo-primetime__section">
        <h2 class="demo-primetime__section-title">
          Why PrimeTime?
        </h2>
        <p class="demo-primetime__section-subtitle">
          Everything you need to build world-class digital products
        </p>

        <div class="demo-primetime__features-grid">
          <m-card
            v-for="feature in features"
            :key="feature.title"
            variant="outlined"
            class="demo-primetime__feature-card"
          >
            <div
              class="demo-primetime__feature-icon"
              :style="{ background: feature.gradient }"
            >
              <m-icon :name="feature.icon" />
            </div>
            <h3 class="demo-primetime__feature-title">
              {{ feature.title }}
            </h3>
            <p class="demo-primetime__feature-desc">
              {{ feature.description }}
            </p>
          </m-card>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="demo-primetime__section demo-primetime__section--alt">
        <h2 class="demo-primetime__section-title">
          Trusted by Teams Worldwide
        </h2>
        <div class="demo-primetime__testimonials">
          <m-card
            v-for="testimonial in testimonials"
            :key="testimonial.name"
            variant="elevated"
            class="demo-primetime__testimonial"
          >
            <p class="demo-primetime__testimonial-text">
              "{{ testimonial.text }}"
            </p>
            <div class="demo-primetime__testimonial-author">
              <m-icon :name="ICONS.accountCircle" />
              <div>
                <strong>{{ testimonial.name }}</strong>
                <span>{{ testimonial.role }}</span>
              </div>
            </div>
          </m-card>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="demo-primetime__cta">
        <h2 class="demo-primetime__cta-title">
          Ready to get started?
        </h2>
        <p class="demo-primetime__cta-subtitle">
          Join thousands of developers building with PrimeTime today.
        </p>
        <div class="demo-primetime__cta-actions">
          <m-button
            variant="filled"
            color="primary"
          >
            Get Started Free
          </m-button>
          <m-button variant="text">
            Contact Sales
          </m-button>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="demo-primetime__footer">
        <div class="demo-primetime__footer-grid">
          <div class="demo-primetime__footer-col">
            <h4>Product</h4>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Changelog</a>
            <a href="#">Roadmap</a>
          </div>
          <div class="demo-primetime__footer-col">
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">Tutorials</a>
            <a href="#">Blog</a>
            <a href="#">Support</a>
          </div>
          <div class="demo-primetime__footer-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Careers</a>
            <a href="#">Press</a>
            <a href="#">Contact</a>
          </div>
          <div class="demo-primetime__footer-col">
            <h4>Connect</h4>
            <a href="#">
              <m-icon :name="ICONS.language" /> Website
            </a>
            <a href="#">
              <m-icon :name="ICONS.email" /> Email
            </a>
            <a href="#">
              <m-icon :name="ICONS.chat" /> Discord
            </a>
          </div>
        </div>
        <div class="demo-primetime__footer-bottom">
          <span>© 2026 PrimeTime. All rights reserved.</span>
        </div>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ICONS } from '~~/shared/constants/icons'

const bp = useBreakpoint()
const isMobile = computed(() => bp.less.value.tablet)
const searchQuery = ref('')
const activeLink = ref('home')
const mobileMenuOpen = ref(false)

const navLinks = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'docs', label: 'Docs' },
  { id: 'blog', label: 'Blog' },
]

const heroStats = [
  { value: '10K+', label: 'Developers' },
  { value: '50+', label: 'Components' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<1ms', label: 'CLS' },
]

const features = [
  { title: 'Lightning Fast', description: 'Zero CLS layout engine with CSS Grid. No JavaScript calculations for positioning.', icon: ICONS.speed, gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { title: 'Beautiful Design', description: 'Material Design 3 tokens and components built for the modern web.', icon: ICONS.palette, gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { title: 'Fully Responsive', description: 'Adaptive layouts that look stunning on mobile, tablet, and desktop.', icon: ICONS.widgets, gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { title: 'Enterprise Ready', description: 'Production-grade security, accessibility, and performance standards.', icon: ICONS.security, gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { title: 'Developer First', description: 'TypeScript-first API, comprehensive docs, and VS Code integration.', icon: ICONS.code, gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { title: 'Cloud Native', description: 'Deploy anywhere — SSR, SSG, or Edge. Built for the modern cloud.', icon: ICONS.cloud, gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
]

const testimonials = [
  { name: 'Alex Chen', role: 'Senior Frontend Engineer', text: 'PrimeTime transformed our development workflow. The layout system is incredibly fast and the components are beautiful out of the box.' },
  { name: 'Maria Santos', role: 'Lead Designer', text: 'Finally a design system that respects Material 3 guidelines while being flexible enough for our custom brand. Absolutely love it.' },
  { name: 'James Wilson', role: 'CTO at TechCorp', text: 'We switched from our custom system and saw 40% reduction in layout shifts. The CSS Grid approach is brilliant.' },
]
</script>

<style lang="scss">
.demo-primetime {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rem;
    height: 100%;
    background: rgba(var(--color-surface-rgb), 0.8);
    backdrop-filter: blur(12rem);
    border-bottom: 1rem solid var(--color-outline-variant);
    position: relative;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 8rem;
    color: var(--color-primary);

    &-text {
      @include typescale('title-large');
      font-weight: 700;
      letter-spacing: -0.5rem;
    }
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 32rem;

    @media (max-width: 768px) {
      display: none;
    }
  }

  &__nav-link {
    text-decoration: none;
    color: var(--color-on-surface-variant);
    transition: color 200ms;
    @include typescale('label-large');

    &:hover, &--active {
      color: var(--color-primary);
    }
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 16rem;
  }

  &__mobile-nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-surface);
    border-bottom: 1rem solid var(--color-outline-variant);
    padding: 16rem;
    display: flex;
    flex-direction: column;
    gap: 16rem;
    z-index: 100;
  }

  &__hero {
    padding: 80rem 24rem;
    text-align: center;
    background: radial-gradient(circle at 50% 0%, var(--color-primary-container) 0%, transparent 70%);

    &-inner {
      max-width: 800rem;
      margin: 0 auto;
    }

    &-title {
      @include typescale('display-large');
      margin: 0 0 24rem;
      color: var(--color-on-surface);
      line-height: 1.1;

      @media (max-width: 600px) {
        @include typescale('display-medium');
      }
    }

    &-subtitle {
      @include typescale('title-medium');
      color: var(--color-on-surface-variant);
      margin: 0 0 40rem;
      max-width: 600rem;
      margin-inline: auto;
    }

    &-actions {
      display: flex;
      justify-content: center;
      gap: 16rem;
      margin-bottom: 64rem;

      @media (max-width: 480px) {
        flex-direction: column;
      }
    }

    &-stats {
      display: flex;
      justify-content: center;
      gap: 48rem;
      flex-wrap: wrap;
    }
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 4rem;

    &-value {
      @include typescale('headline-medium');
      color: var(--color-primary);
      font-weight: 700;
    }

    &-label {
      @include typescale('label-medium');
      color: var(--color-on-surface-variant);
    }
  }

  &__section {
    padding: 80rem 24rem;

    &--alt {
      background: var(--color-surface-container-low);
    }
  }

  &__section-title {
    @include typescale('headline-large');
    text-align: center;
    margin: 0 0 16rem;
  }

  &__section-subtitle {
    @include typescale('title-medium');
    text-align: center;
    color: var(--color-on-surface-variant);
    margin: 0 0 48rem;
  }

  &__features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300rem, 1fr));
    gap: 24rem;
    max-width: 1200rem;
    margin: 0 auto;
  }

  &__feature-card {
    padding: 32rem;
    height: 100%;
    transition: transform 200ms;

    &:hover {
      transform: translateY(-8rem);
    }
  }

  &__feature-icon {
    width: 56rem;
    height: 56rem;
    border-radius: 16rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin-bottom: 24rem;
  }

  &__feature-title {
    @include typescale('title-large');
    margin: 0 0 12rem;
  }

  &__testimonials {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350rem, 1fr));
    gap: 24rem;
    max-width: 1200rem;
    margin: 0 auto;
  }

  &__testimonial {
    padding: 32rem;

    &-text {
      @include typescale('body-large');
      font-style: italic;
      margin-bottom: 24rem;
    }

    &-author {
      display: flex;
      align-items: center;
      gap: 16rem;

      strong {
        display: block;
        @include typescale('title-medium');
      }

      span {
        @include typescale('body-small');
        color: var(--color-on-surface-variant);
      }
    }
  }

  &__cta {
    padding: 100rem 24rem;
    text-align: center;
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);

    &-title {
      @include typescale('display-small');
      margin-bottom: 16rem;
    }

    &-subtitle {
      @include typescale('title-medium');
      margin-bottom: 40rem;
    }

    &-actions {
      display: flex;
      justify-content: center;
      gap: 16rem;
    }
  }

  &__footer {
    padding: 64rem 24rem 32rem;
    background: var(--color-surface-container);
    border-top: 1rem solid var(--color-outline-variant);
  }

  &__footer-grid {
    display: grid;
    grid-template-columns: 2fr repeat(3, 1fr);
    gap: 32rem;
    max-width: 1200rem;
    margin: 0 auto 32rem;

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 24rem;
    }

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  &__footer-col {
    display: flex;
    flex-direction: column;
    gap: 8rem;

    h4 {
      margin: 0 0 8rem;
      color: var(--color-on-surface);
      @include typescale('title-small');
    }

    a {
      color: var(--color-on-surface-variant);
      text-decoration: none;
      @include typescale('body-medium');
      transition: color 200ms;

      &:hover {
        color: var(--color-primary);
      }
    }
  }

  &__footer-bottom {
    text-align: center;
    padding-top: 32rem;
    border-top: 1rem solid var(--color-outline-variant);
    color: var(--color-on-surface-variant);
    @include typescale('body-small');
  }
}
</style>
