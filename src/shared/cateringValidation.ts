export const CATERING_LIMITS = {
  nameMax: 80,
  phoneMax: 20,
  guestsMin: 1,
  guestsMax: 5000,
  commentMax: 1000,
  eventDateMinMinutesFromNow: 60,
} as const;

export type CateringFormValues = {
  name: string;
  phone: string;
  eventDateTime: string;
  guests: string;
  comment: string;
};

export type CateringValidationErrors = Partial<Record<keyof CateringFormValues, string>>;

const RU_PHONE_PATTERN = /^\+?[0-9()\-\s]{10,20}$/;

export function normalizePhone(raw: string): string {
  const stripped = raw.trim().replace(/[()\-\s]/g, "");
  if (stripped.startsWith("8") && stripped.length === 11) {
    return `+7${stripped.slice(1)}`;
  }
  if (!stripped.startsWith("+") && stripped.length === 11 && stripped.startsWith("7")) {
    return `+${stripped}`;
  }
  if (!stripped.startsWith("+") && stripped.length === 10) {
    return `+7${stripped}`;
  }
  return stripped.startsWith("+") ? stripped : `+${stripped}`;
}

export function validateCateringForm(values: CateringFormValues, now = new Date()): CateringValidationErrors {
  const errors: CateringValidationErrors = {};

  const name = values.name.trim();
  const phone = values.phone.trim();
  const guests = Number(values.guests);
  const comment = values.comment.trim();

  if (!name) {
    errors.name = "Укажите имя";
  } else if (name.length > CATERING_LIMITS.nameMax) {
    errors.name = `Максимум ${CATERING_LIMITS.nameMax} символов`;
  }

  if (!phone) {
    errors.phone = "Укажите телефон";
  } else if (!RU_PHONE_PATTERN.test(phone)) {
    errors.phone = "Телефон в формате +79991234567";
  }

  if (!values.eventDateTime) {
    errors.eventDateTime = "Укажите дату и время";
  } else {
    const eventDate = new Date(values.eventDateTime);
    const minDate = new Date(now.getTime() + CATERING_LIMITS.eventDateMinMinutesFromNow * 60_000);
    if (Number.isNaN(eventDate.getTime())) {
      errors.eventDateTime = "Некорректная дата";
    } else if (eventDate < minDate) {
      errors.eventDateTime = `Минимум за ${CATERING_LIMITS.eventDateMinMinutesFromNow} минут до события`;
    }
  }

  if (!values.guests.trim()) {
    errors.guests = "Укажите количество гостей";
  } else if (!Number.isInteger(guests)) {
    errors.guests = "Количество гостей должно быть целым числом";
  } else if (guests < CATERING_LIMITS.guestsMin || guests > CATERING_LIMITS.guestsMax) {
    errors.guests = `Диапазон: ${CATERING_LIMITS.guestsMin}-${CATERING_LIMITS.guestsMax}`;
  }

  if (comment.length > CATERING_LIMITS.commentMax) {
    errors.comment = `Максимум ${CATERING_LIMITS.commentMax} символов`;
  }

  return errors;
}

export function hasValidationErrors(errors: CateringValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
