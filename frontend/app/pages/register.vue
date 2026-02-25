<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Register"
        description="Create an account to access your account."
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
      />
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";

definePageMeta({
  auth: {
    unauthenticatedOnly: true, // Дозволено ТІЛЬКИ неавторизованим
    navigateAuthenticatedTo: "/", // Куди редіректити, якщо юзер вже зайшов
  },
});

const { signUp } = useAuth();
const toast = useToast();

const fields: AuthFormField[] = [
  {
    name: "name",
    type: "text",
    label: "Name",
    placeholder: "Enter your name",
    required: true,
  },
  {
    name: "username",
    type: "text",
    label: "Username",
    placeholder: "Enter your username",
    required: true,
  },
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
  {
    name: "password_confirmation",
    label: "Confirm Password",
    type: "password",
    placeholder: "Confirm your password",
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

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Must be at least 8 characters"),
    password_confirmation: z
      .string()
      .min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"], // Вказуємо, на якому полі показувати помилку
  });

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    // 1. Провайдер має називатися 'local' (якщо ти так вказав у nuxt.config)
    // 2. redirect: true автоматично перекине юзера на головну після успіху
    const credentials = {
      name: payload.data.name,
      username: payload.data.username,
      email: payload.data.email,
      password: payload.data.password,
      password_confirmation: payload.data.password_confirmation,
    };
    await signUp(credentials, {
      callbackUrl: "/login",
      redirect: true,
      preventLoginFlow: true,
    });

    toast.add({ title: "Успіх", description: "Ви успішно зареєструвались" });
  } catch (error: any) {
    // // Sidebase викидає помилку, якщо статус відповіді не 2xx
    // toast.add({
    //   title: "Помилка входу",
    //   description: "Невірний email або пароль",
    //   color: "error",
    // });
  }
}
</script>
