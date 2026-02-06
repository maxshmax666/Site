import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { supabase } from "../lib/supabase";
import {
  CATERING_LIMITS,
  type CateringFormValues,
  hasValidationErrors,
  normalizePhone,
  validateCateringForm,
} from "../shared/cateringValidation";

type SubmitState = "idle" | "submitting" | "success" | "error";

const INITIAL_VALUES: CateringFormValues = {
  name: "",
  phone: "",
  eventDateTime: "",
  guests: "",
  comment: "",
};

export function CateringPage() {
  const [values, setValues] = useState<CateringFormValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<Partial<Record<keyof CateringFormValues, boolean>>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState<string>("");

  const errors = useMemo(() => validateCateringForm(values), [values]);

  const onFieldChange =
    (field: keyof CateringFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setValues((prev) => ({ ...prev, [field]: nextValue }));
      if (submitState === "success" || submitState === "error") {
        setSubmitState("idle");
        setSubmitMessage("");
      }
    };

  const onBlur = (field: keyof CateringFormValues) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({
      name: true,
      phone: true,
      eventDateTime: true,
      guests: true,
      comment: true,
    });

    const validation = validateCateringForm(values);
    if (hasValidationErrors(validation)) {
      setSubmitState("error");
      setSubmitMessage("Проверьте форму: есть ошибки в обязательных полях.");
      return;
    }

    setSubmitState("submitting");
    setSubmitMessage("");

    const payload = {
      name: values.name.trim(),
      phone: normalizePhone(values.phone),
      eventDateTime: new Date(values.eventDateTime).toISOString(),
      guests: Number(values.guests),
      comment: values.comment.trim() || null,
    };

    const { error } = await supabase.functions.invoke("catering-request", {
      body: payload,
    });

    if (error) {
      setSubmitState("error");
      setSubmitMessage(error.message || "Не удалось отправить заявку. Попробуйте позже.");
      return;
    }

    setSubmitState("success");
    setSubmitMessage("Заявка отправлена. Мы свяжемся с вами в течение 15 минут.");
    setValues(INITIAL_VALUES);
    setTouched({});
  };

  const isSubmitting = submitState === "submitting";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Кейтеринг / События</h1>
      <div className="mt-2 text-white/70">Наборы на офис, день рождения, тусовку.</div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="text-xl font-bold">Пакеты</div>
          <div className="mt-4 space-y-3 text-white/80">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">На 10 человек — пицца + напитки</div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">На 20 человек — комбо + соусы</div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">На 50 человек — под задачу</div>
          </div>
        </div>

        <form
          className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft"
          onSubmit={onSubmit}
          noValidate
          aria-busy={isSubmitting}
        >
          <div className="text-xl font-bold">Заявка</div>
          <div className="mt-4 grid gap-3">
            <div>
              <Input placeholder="Имя" value={values.name} onChange={onFieldChange("name")} onBlur={onBlur("name")} />
              {touched.name && errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
            </div>

            <div>
              <Input
                placeholder="Телефон"
                inputMode="tel"
                value={values.phone}
                onChange={onFieldChange("phone")}
                onBlur={onBlur("phone")}
              />
              {touched.phone && errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone}</p>}
            </div>

            <div>
              <Input
                type="datetime-local"
                value={values.eventDateTime}
                onChange={onFieldChange("eventDateTime")}
                onBlur={onBlur("eventDateTime")}
              />
              {touched.eventDateTime && errors.eventDateTime && (
                <p className="mt-1 text-xs text-danger">{errors.eventDateTime}</p>
              )}
            </div>

            <div>
              <Input
                placeholder="Сколько человек"
                inputMode="numeric"
                value={values.guests}
                onChange={onFieldChange("guests")}
                onBlur={onBlur("guests")}
              />
              {touched.guests && errors.guests && <p className="mt-1 text-xs text-danger">{errors.guests}</p>}
            </div>

            <div>
              <textarea
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-yellow/35 min-h-24"
                placeholder="Комментарий"
                value={values.comment}
                onChange={onFieldChange("comment")}
                onBlur={onBlur("comment")}
                maxLength={CATERING_LIMITS.commentMax}
              />
              <div className="mt-1 flex items-center justify-between">
                {touched.comment && errors.comment ? (
                  <p className="text-xs text-danger">{errors.comment}</p>
                ) : (
                  <span className="text-xs text-white/40">Необязательно</span>
                )}
                <span className="text-xs text-white/50">
                  {values.comment.length}/{CATERING_LIMITS.commentMax}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Отправляем..." : "Отправить"}
            </Button>
          </div>

          {submitMessage && (
            <div className={`mt-3 text-sm ${submitState === "success" ? "text-green-300" : "text-danger"}`} role="status">
              {submitMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
