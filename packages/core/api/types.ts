export type GovernedResponse<T> = {
  ok?: boolean;
  data?: T;
} & T;
