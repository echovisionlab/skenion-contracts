import type {
  PackageListingObjectExportSummaryV01,
  PackageObjectExportV01
} from "./index.js";

type Assert<T extends true> = T;

type PackageObjectExportPublicApiSmoke = Assert<
  PackageObjectExportV01 extends {
    objectId: string;
    primaryObjectSpec: string;
    definitionPath: string;
  }
    ? true
    : false
>;

type PackageListingObjectExportPublicApiSmoke = Assert<
  PackageListingObjectExportSummaryV01 extends {
    objectId: string;
    primaryObjectSpec: string;
    definitionPath: string;
  }
    ? true
    : false
>;
