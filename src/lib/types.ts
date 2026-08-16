export type Material =
  | "газобетон"
  | "кирпич"
  | "каркас"
  | "керамический блок";

export type PackageOption =
  | "коробка"
  | "тёплый контур"
  | "под отделку"
  | "под ключ";

export type CalculatorValues = {
  area: number;
  floors: number;
  material: Material;
  packageOption: PackageOption;
};

export type HouseProject = {
  id: string;
  title: string;
  area: number;
  floors: number;
  summary: string;
  imageSrc: string;
  imageAlt: string;
};
