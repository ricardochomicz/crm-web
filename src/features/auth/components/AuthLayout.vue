<script setup lang="ts">
import BrandLogo from '@/components/ui/BrandLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
</script>
<template>
  <div class="min-h-dvh bg-[#fcfbf9] lg:grid lg:grid-cols-[1fr_1fr]">
    <aside
      class="auth-story relative hidden min-h-dvh overflow-hidden p-12 text-white lg:flex lg:flex-col xl:p-16"
    >
      <BrandLogo class="relative z-10" />
      <div class="relative z-10 my-auto max-w-xl py-16">
        <div
          class="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] tracking-[.15em] text-orange-200"
        >
          <span class="size-1.5 rounded-full bg-orange-400" /> MENOS DISTÂNCIA. MAIS CONEXÃO.
        </div>
        <h1 class="text-5xl font-medium leading-[1.12] tracking-[-.045em] xl:text-6xl">
          Grandes relações.<br />Novas
          <span class="font-serif italic text-orange-300">possibilidades.</span>
        </h1>
        <p class="mt-6 max-w-sm text-base leading-7 text-slate-300">
          Aproxime sua equipe. Organize seu dia.<br />Dê espaço para o seu negócio crescer.
        </p>
        <div class="connection-art relative mt-12 h-64" aria-hidden="true">
          <div class="orbit orbit-one" />
          <div class="orbit orbit-two" />
          <div
            class="absolute left-[39%] top-[35%] flex size-20 items-center justify-center rounded-3xl border border-orange-200/30 bg-orange-500 text-white shadow-[0_0_80px_#f9731644]"
          >
            <AppIcon name="grid" class="size-9" />
          </div>
          <div
            class="float-card absolute left-0 top-5 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#303631] px-4 py-3 shadow-xl"
          >
            <span
              class="flex size-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"
              ><AppIcon name="check" class="size-5"
            /></span>
            <div>
              <p class="text-xs font-medium">Equipe conectada</p>
              <p class="mt-1 text-[10px] text-slate-400">Todo mundo na mesma página</p>
            </div>
          </div>
          <div
            class="float-card absolute bottom-1 right-0 rounded-2xl border border-white/15 bg-[#303631] px-5 py-4 shadow-xl"
          >
            <div class="mb-3 flex -space-x-2">
              <span
                v-for="(initial, index) in ['AC', 'LM', 'JR']"
                :key="initial"
                class="flex size-8 items-center justify-center rounded-full border-2 border-[#303631] text-[9px] font-bold"
                :class="
                  [
                    'bg-orange-200 text-orange-950',
                    'bg-violet-200 text-violet-950',
                    'bg-emerald-200 text-emerald-950',
                  ][index]
                "
                >{{ initial }}</span
              ><span
                class="flex size-8 items-center justify-center rounded-full border-2 border-[#303631] bg-slate-600 text-[10px]"
                >+</span
              >
            </div>
            <p class="text-xs text-slate-200">Juntos, o próximo passo.</p>
          </div>
        </div>
      </div>
      <p class="relative z-10 text-xs text-slate-400">
        Seu próximo capítulo começa com uma conexão.
      </p>
    </aside>
    <main id="main-content" class="relative flex min-h-dvh flex-col px-6 py-8 sm:px-12 lg:px-14">
      <div class="mb-10 lg:hidden"><BrandLogo /></div>
      <div class="flex flex-1 items-center justify-center py-5">
        <div class="auth-enter w-full max-w-[420px]"><slot /></div>
      </div>
      <footer
        class="mt-10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400"
      >
        <span>© {{ new Date().getFullYear() }} TelecomHub</span
        ><span class="inline-flex items-center gap-1.5"
          ><AppIcon name="lock" class="size-3.5" /> Um espaço para suas conexões</span
        >
      </footer>
    </main>
  </div>
</template>
