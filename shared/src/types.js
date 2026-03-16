"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadType = exports.PaymentStatus = exports.ListingStatus = exports.RouteStatus = exports.AccountStatus = exports.PoolSize = exports.PoolType = exports.ServiceFrequency = exports.ServiceType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["BUYER"] = "buyer";
    UserRole["SELLER"] = "seller";
    UserRole["OPERATOR"] = "operator";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var ServiceType;
(function (ServiceType) {
    ServiceType["WEEKLY"] = "weekly";
    ServiceType["BIWEEKLY"] = "biweekly";
    ServiceType["MONTHLY"] = "monthly";
    ServiceType["ONETIME"] = "onetime";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
var ServiceFrequency;
(function (ServiceFrequency) {
    ServiceFrequency["WEEKLY"] = "weekly";
    ServiceFrequency["BIWEEKLY"] = "biweekly";
    ServiceFrequency["MONTHLY"] = "monthly";
})(ServiceFrequency || (exports.ServiceFrequency = ServiceFrequency = {}));
var PoolType;
(function (PoolType) {
    PoolType["CHLORINE"] = "chlorine";
    PoolType["SALTWATER"] = "saltwater";
    PoolType["NATURAL"] = "natural";
})(PoolType || (exports.PoolType = PoolType = {}));
var PoolSize;
(function (PoolSize) {
    PoolSize["SMALL"] = "small";
    PoolSize["MEDIUM"] = "medium";
    PoolSize["LARGE"] = "large";
    PoolSize["XLARGE"] = "xlarge";
})(PoolSize || (exports.PoolSize = PoolSize = {}));
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACTIVE"] = "active";
    AccountStatus["INACTIVE"] = "inactive";
    AccountStatus["SUSPENDED"] = "suspended";
    AccountStatus["CANCELLED"] = "cancelled";
    AccountStatus["PENDING"] = "pending";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
var RouteStatus;
(function (RouteStatus) {
    RouteStatus["ACTIVE"] = "active";
    RouteStatus["INACTIVE"] = "inactive";
    RouteStatus["FOR_SALE"] = "for_sale";
    RouteStatus["IN_ESCROW"] = "in_escrow";
    RouteStatus["SOLD"] = "sold";
})(RouteStatus || (exports.RouteStatus = RouteStatus = {}));
var ListingStatus;
(function (ListingStatus) {
    ListingStatus["DRAFT"] = "draft";
    ListingStatus["ACTIVE"] = "active";
    ListingStatus["PENDING"] = "pending";
    ListingStatus["IN_ESCROW"] = "in_escrow";
    ListingStatus["SOLD"] = "sold";
    ListingStatus["WITHDRAWN"] = "withdrawn";
})(ListingStatus || (exports.ListingStatus = ListingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["LATE"] = "late";
    PaymentStatus["MISSED"] = "missed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var UploadType;
(function (UploadType) {
    UploadType["ROUTE_CSV"] = "route_csv";
    UploadType["ROUTE_PDF"] = "route_pdf";
    UploadType["ROUTE_IMAGE"] = "route_image";
    UploadType["LISTING_IMAGE"] = "listing_image";
    UploadType["LISTING_DOCUMENT"] = "listing_document";
})(UploadType || (exports.UploadType = UploadType = {}));
//# sourceMappingURL=types.js.map