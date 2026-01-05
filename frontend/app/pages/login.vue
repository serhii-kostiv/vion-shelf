<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";

definePageMeta({
  auth: {
    unauthenticatedOnly: true, // Дозволено ТІЛЬКИ неавторизованим
    navigateAuthenticatedTo: "/", // Куди редіректити, якщо юзер вже зайшов
  },
});

const { signIn } = useAuth();
const toast = useToast();

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "Enter your email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
  // {
  //   name: "remember",
  //   label: "Remember me",
  //   type: "checkbox",
  // },
];

const providers = [
  {
    label: "Google",
    icon: "i-simple-icons-google",
    disabled: true,
    onClick: () => {
      toast.add({ title: "Google", description: "Login with Google" });
    },
  },
  {
    label: "GitHub",
    icon: "i-simple-icons-github",
    disabled: true,
    onClick: () => {
      toast.add({ title: "GitHub", description: "Login with GitHub" });
    },
  },
];

const schema = z.object({
  email: z.email("Invalid email"),
  password: z
    .string("Password is required")
    .min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    // 1. Провайдер має називатися 'local' (якщо ти так вказав у nuxt.config)
    // 2. redirect: true автоматично перекине юзера на головну після успіху
    const credentials = {
      email: payload.data.email,
      password: payload.data.password,
    };
    await signIn(credentials, { callbackUrl: "/", redirect: true });

    toast.add({ title: "Успіх", description: "Ви увійшли в систему" });
  } catch (error: any) {
    // Sidebase викидає помилку, якщо статус відповіді не 2xx
    toast.add({
      title: "Помилка входу",
      description: "Невірний email або пароль",
      color: "error",
    });
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Login"
        description="Enter your credentials to access your account."
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
      />
    </UPageCard>
  </div>
</template>
