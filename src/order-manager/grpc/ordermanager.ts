/**
 * Generated by the protoc-gen-ts.  DO NOT EDIT!
 * compiler version: 3.19.1
 * source: ordermanager.proto
 * git: https://github.com/thesayyn/protoc-gen-ts */
import * as pb_1 from "google-protobuf";
import * as grpc_1 from "@grpc/grpc-js";
export namespace ordermanager {
    export enum ActionType {
        UNKNOWN_ACTION = 0,
        SELL = 1,
        BUY = 2
    }
    export enum Behavior {
        UNKNOWN_BEHAVIOR = 0,
        MARKET = 1,
        LIMIT = 2
    }
    export enum QuantityType {
        UNKNOWN_QUANTITY_TYPE = 0,
        FIXED = 1,
        PERCENT = 2
    }
    export enum DeadlineType {
        UNKNOWN_DEADLINE_TYPE = 0,
        TIME = 1
    }
    export enum DeadlineAction {
        UNKNOWN_DEADLINE_ACTION = 0,
        CANCEL = 1,
        SELL_BY_MARKET = 2
    }
    export class CreateOrderRequest extends pb_1.Message {
        #one_of_decls: number[][] = [];
        constructor(data?: any[] | {
            pair?: string;
            market?: string;
            action?: ActionType;
            behavior?: Behavior;
            price?: string;
            quantity?: Quantity;
            deadlines?: Deadline[];
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [7], this.#one_of_decls);
            if (!Array.isArray(data) && typeof data == "object") {
                if ("pair" in data && data.pair != undefined) {
                    this.pair = data.pair;
                }
                if ("market" in data && data.market != undefined) {
                    this.market = data.market;
                }
                if ("action" in data && data.action != undefined) {
                    this.action = data.action;
                }
                if ("behavior" in data && data.behavior != undefined) {
                    this.behavior = data.behavior;
                }
                if ("price" in data && data.price != undefined) {
                    this.price = data.price;
                }
                if ("quantity" in data && data.quantity != undefined) {
                    this.quantity = data.quantity;
                }
                if ("deadlines" in data && data.deadlines != undefined) {
                    this.deadlines = data.deadlines;
                }
            }
        }
        get pair() {
            return pb_1.Message.getFieldWithDefault(this, 1, "") as string;
        }
        set pair(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get market() {
            return pb_1.Message.getFieldWithDefault(this, 2, "") as string;
        }
        set market(value: string) {
            pb_1.Message.setField(this, 2, value);
        }
        get action() {
            return pb_1.Message.getFieldWithDefault(this, 3, ActionType.UNKNOWN_ACTION) as ActionType;
        }
        set action(value: ActionType) {
            pb_1.Message.setField(this, 3, value);
        }
        get behavior() {
            return pb_1.Message.getFieldWithDefault(this, 4, Behavior.UNKNOWN_BEHAVIOR) as Behavior;
        }
        set behavior(value: Behavior) {
            pb_1.Message.setField(this, 4, value);
        }
        get price() {
            return pb_1.Message.getFieldWithDefault(this, 5, "") as string;
        }
        set price(value: string) {
            pb_1.Message.setField(this, 5, value);
        }
        get quantity() {
            return pb_1.Message.getWrapperField(this, Quantity, 6) as Quantity;
        }
        set quantity(value: Quantity) {
            pb_1.Message.setWrapperField(this, 6, value);
        }
        get has_quantity() {
            return pb_1.Message.getField(this, 6) != null;
        }
        get deadlines() {
            return pb_1.Message.getRepeatedWrapperField(this, Deadline, 7) as Deadline[];
        }
        set deadlines(value: Deadline[]) {
            pb_1.Message.setRepeatedWrapperField(this, 7, value);
        }
        static fromObject(data: {
            pair?: string;
            market?: string;
            action?: ActionType;
            behavior?: Behavior;
            price?: string;
            quantity?: ReturnType<typeof Quantity.prototype.toObject>;
            deadlines?: ReturnType<typeof Deadline.prototype.toObject>[];
        }): CreateOrderRequest {
            const message = new CreateOrderRequest({});
            if (data.pair != null) {
                message.pair = data.pair;
            }
            if (data.market != null) {
                message.market = data.market;
            }
            if (data.action != null) {
                message.action = data.action;
            }
            if (data.behavior != null) {
                message.behavior = data.behavior;
            }
            if (data.price != null) {
                message.price = data.price;
            }
            if (data.quantity != null) {
                message.quantity = Quantity.fromObject(data.quantity);
            }
            if (data.deadlines != null) {
                message.deadlines = data.deadlines.map(item => Deadline.fromObject(item));
            }
            return message;
        }
        toObject() {
            const data: {
                pair?: string;
                market?: string;
                action?: ActionType;
                behavior?: Behavior;
                price?: string;
                quantity?: ReturnType<typeof Quantity.prototype.toObject>;
                deadlines?: ReturnType<typeof Deadline.prototype.toObject>[];
            } = {};
            if (this.pair != null) {
                data.pair = this.pair;
            }
            if (this.market != null) {
                data.market = this.market;
            }
            if (this.action != null) {
                data.action = this.action;
            }
            if (this.behavior != null) {
                data.behavior = this.behavior;
            }
            if (this.price != null) {
                data.price = this.price;
            }
            if (this.quantity != null) {
                data.quantity = this.quantity.toObject();
            }
            if (this.deadlines != null) {
                data.deadlines = this.deadlines.map((item: Deadline) => item.toObject());
            }
            return data;
        }
        serialize(): Uint8Array;
        serialize(w: pb_1.BinaryWriter): void;
        serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
            const writer = w || new pb_1.BinaryWriter();
            if (this.pair.length)
                writer.writeString(1, this.pair);
            if (this.market.length)
                writer.writeString(2, this.market);
            if (this.action != ActionType.UNKNOWN_ACTION)
                writer.writeEnum(3, this.action);
            if (this.behavior != Behavior.UNKNOWN_BEHAVIOR)
                writer.writeEnum(4, this.behavior);
            if (this.price.length)
                writer.writeString(5, this.price);
            if (this.has_quantity)
                writer.writeMessage(6, this.quantity, () => this.quantity.serialize(writer));
            if (this.deadlines.length)
                writer.writeRepeatedMessage(7, this.deadlines, (item: Deadline) => item.serialize(writer));
            if (!w)
                return writer.getResultBuffer();
        }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): CreateOrderRequest {
            const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes), message = new CreateOrderRequest();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.pair = reader.readString();
                        break;
                    case 2:
                        message.market = reader.readString();
                        break;
                    case 3:
                        message.action = reader.readEnum();
                        break;
                    case 4:
                        message.behavior = reader.readEnum();
                        break;
                    case 5:
                        message.price = reader.readString();
                        break;
                    case 6:
                        reader.readMessage(message.quantity, () => message.quantity = Quantity.deserialize(reader));
                        break;
                    case 7:
                        reader.readMessage(message.deadlines, () => pb_1.Message.addToRepeatedWrapperField(message, 7, Deadline.deserialize(reader), Deadline));
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
        serializeBinary(): Uint8Array {
            return this.serialize();
        }
        static deserializeBinary(bytes: Uint8Array): CreateOrderRequest {
            return CreateOrderRequest.deserialize(bytes);
        }
    }
    export class CreateOrderResponse extends pb_1.Message {
        #one_of_decls: number[][] = [];
        constructor(data?: any[] | {
            success?: boolean;
            message?: string;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [], this.#one_of_decls);
            if (!Array.isArray(data) && typeof data == "object") {
                if ("success" in data && data.success != undefined) {
                    this.success = data.success;
                }
                if ("message" in data && data.message != undefined) {
                    this.message = data.message;
                }
            }
        }
        get success() {
            return pb_1.Message.getFieldWithDefault(this, 1, false) as boolean;
        }
        set success(value: boolean) {
            pb_1.Message.setField(this, 1, value);
        }
        get message() {
            return pb_1.Message.getFieldWithDefault(this, 2, "") as string;
        }
        set message(value: string) {
            pb_1.Message.setField(this, 2, value);
        }
        static fromObject(data: {
            success?: boolean;
            message?: string;
        }): CreateOrderResponse {
            const message = new CreateOrderResponse({});
            if (data.success != null) {
                message.success = data.success;
            }
            if (data.message != null) {
                message.message = data.message;
            }
            return message;
        }
        toObject() {
            const data: {
                success?: boolean;
                message?: string;
            } = {};
            if (this.success != null) {
                data.success = this.success;
            }
            if (this.message != null) {
                data.message = this.message;
            }
            return data;
        }
        serialize(): Uint8Array;
        serialize(w: pb_1.BinaryWriter): void;
        serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
            const writer = w || new pb_1.BinaryWriter();
            if (this.success != false)
                writer.writeBool(1, this.success);
            if (this.message.length)
                writer.writeString(2, this.message);
            if (!w)
                return writer.getResultBuffer();
        }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): CreateOrderResponse {
            const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes), message = new CreateOrderResponse();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.success = reader.readBool();
                        break;
                    case 2:
                        message.message = reader.readString();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
        serializeBinary(): Uint8Array {
            return this.serialize();
        }
        static deserializeBinary(bytes: Uint8Array): CreateOrderResponse {
            return CreateOrderResponse.deserialize(bytes);
        }
    }
    export class Quantity extends pb_1.Message {
        #one_of_decls: number[][] = [];
        constructor(data?: any[] | {
            type?: QuantityType;
            value?: string;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [], this.#one_of_decls);
            if (!Array.isArray(data) && typeof data == "object") {
                if ("type" in data && data.type != undefined) {
                    this.type = data.type;
                }
                if ("value" in data && data.value != undefined) {
                    this.value = data.value;
                }
            }
        }
        get type() {
            return pb_1.Message.getFieldWithDefault(this, 1, QuantityType.UNKNOWN_QUANTITY_TYPE) as QuantityType;
        }
        set type(value: QuantityType) {
            pb_1.Message.setField(this, 1, value);
        }
        get value() {
            return pb_1.Message.getFieldWithDefault(this, 2, "") as string;
        }
        set value(value: string) {
            pb_1.Message.setField(this, 2, value);
        }
        static fromObject(data: {
            type?: QuantityType;
            value?: string;
        }): Quantity {
            const message = new Quantity({});
            if (data.type != null) {
                message.type = data.type;
            }
            if (data.value != null) {
                message.value = data.value;
            }
            return message;
        }
        toObject() {
            const data: {
                type?: QuantityType;
                value?: string;
            } = {};
            if (this.type != null) {
                data.type = this.type;
            }
            if (this.value != null) {
                data.value = this.value;
            }
            return data;
        }
        serialize(): Uint8Array;
        serialize(w: pb_1.BinaryWriter): void;
        serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
            const writer = w || new pb_1.BinaryWriter();
            if (this.type != QuantityType.UNKNOWN_QUANTITY_TYPE)
                writer.writeEnum(1, this.type);
            if (this.value.length)
                writer.writeString(2, this.value);
            if (!w)
                return writer.getResultBuffer();
        }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): Quantity {
            const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes), message = new Quantity();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.type = reader.readEnum();
                        break;
                    case 2:
                        message.value = reader.readString();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
        serializeBinary(): Uint8Array {
            return this.serialize();
        }
        static deserializeBinary(bytes: Uint8Array): Quantity {
            return Quantity.deserialize(bytes);
        }
    }
    export class Deadline extends pb_1.Message {
        #one_of_decls: number[][] = [];
        constructor(data?: any[] | {
            type?: DeadlineType;
            value?: string;
            action?: DeadlineAction;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [], this.#one_of_decls);
            if (!Array.isArray(data) && typeof data == "object") {
                if ("type" in data && data.type != undefined) {
                    this.type = data.type;
                }
                if ("value" in data && data.value != undefined) {
                    this.value = data.value;
                }
                if ("action" in data && data.action != undefined) {
                    this.action = data.action;
                }
            }
        }
        get type() {
            return pb_1.Message.getFieldWithDefault(this, 1, DeadlineType.UNKNOWN_DEADLINE_TYPE) as DeadlineType;
        }
        set type(value: DeadlineType) {
            pb_1.Message.setField(this, 1, value);
        }
        get value() {
            return pb_1.Message.getFieldWithDefault(this, 2, "") as string;
        }
        set value(value: string) {
            pb_1.Message.setField(this, 2, value);
        }
        get action() {
            return pb_1.Message.getFieldWithDefault(this, 3, DeadlineAction.UNKNOWN_DEADLINE_ACTION) as DeadlineAction;
        }
        set action(value: DeadlineAction) {
            pb_1.Message.setField(this, 3, value);
        }
        static fromObject(data: {
            type?: DeadlineType;
            value?: string;
            action?: DeadlineAction;
        }): Deadline {
            const message = new Deadline({});
            if (data.type != null) {
                message.type = data.type;
            }
            if (data.value != null) {
                message.value = data.value;
            }
            if (data.action != null) {
                message.action = data.action;
            }
            return message;
        }
        toObject() {
            const data: {
                type?: DeadlineType;
                value?: string;
                action?: DeadlineAction;
            } = {};
            if (this.type != null) {
                data.type = this.type;
            }
            if (this.value != null) {
                data.value = this.value;
            }
            if (this.action != null) {
                data.action = this.action;
            }
            return data;
        }
        serialize(): Uint8Array;
        serialize(w: pb_1.BinaryWriter): void;
        serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
            const writer = w || new pb_1.BinaryWriter();
            if (this.type != DeadlineType.UNKNOWN_DEADLINE_TYPE)
                writer.writeEnum(1, this.type);
            if (this.value.length)
                writer.writeString(2, this.value);
            if (this.action != DeadlineAction.UNKNOWN_DEADLINE_ACTION)
                writer.writeEnum(3, this.action);
            if (!w)
                return writer.getResultBuffer();
        }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): Deadline {
            const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes), message = new Deadline();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.type = reader.readEnum();
                        break;
                    case 2:
                        message.value = reader.readString();
                        break;
                    case 3:
                        message.action = reader.readEnum();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
        serializeBinary(): Uint8Array {
            return this.serialize();
        }
        static deserializeBinary(bytes: Uint8Array): Deadline {
            return Deadline.deserialize(bytes);
        }
    }
    interface GrpcUnaryServiceInterface<P, R> {
        (message: P, metadata: grpc_1.Metadata, options: grpc_1.CallOptions, callback: grpc_1.requestCallback<R>): grpc_1.ClientUnaryCall;
        (message: P, metadata: grpc_1.Metadata, callback: grpc_1.requestCallback<R>): grpc_1.ClientUnaryCall;
        (message: P, options: grpc_1.CallOptions, callback: grpc_1.requestCallback<R>): grpc_1.ClientUnaryCall;
        (message: P, callback: grpc_1.requestCallback<R>): grpc_1.ClientUnaryCall;
    }
    interface GrpcStreamServiceInterface<P, R> {
        (message: P, metadata: grpc_1.Metadata, options?: grpc_1.CallOptions): grpc_1.ClientReadableStream<R>;
        (message: P, options?: grpc_1.CallOptions): grpc_1.ClientReadableStream<R>;
    }
    interface GrpWritableServiceInterface<P, R> {
        (metadata: grpc_1.Metadata, options: grpc_1.CallOptions, callback: grpc_1.requestCallback<R>): grpc_1.ClientWritableStream<P>;
        (metadata: grpc_1.Metadata, callback: grpc_1.requestCallback<R>): grpc_1.ClientWritableStream<P>;
        (options: grpc_1.CallOptions, callback: grpc_1.requestCallback<R>): grpc_1.ClientWritableStream<P>;
        (callback: grpc_1.requestCallback<R>): grpc_1.ClientWritableStream<P>;
    }
    interface GrpcChunkServiceInterface<P, R> {
        (metadata: grpc_1.Metadata, options?: grpc_1.CallOptions): grpc_1.ClientDuplexStream<P, R>;
        (options?: grpc_1.CallOptions): grpc_1.ClientDuplexStream<P, R>;
    }
    interface GrpcPromiseServiceInterface<P, R> {
        (message: P, metadata: grpc_1.Metadata, options?: grpc_1.CallOptions): Promise<R>;
        (message: P, options?: grpc_1.CallOptions): Promise<R>;
    }
    export abstract class UnimplementedOrderManagerService {
        static definition = {
            CreateOrder: {
                path: "/ordermanager.OrderManager/CreateOrder",
                requestStream: false,
                responseStream: false,
                requestSerialize: (message: CreateOrderRequest) => Buffer.from(message.serialize()),
                requestDeserialize: (bytes: Buffer) => CreateOrderRequest.deserialize(new Uint8Array(bytes)),
                responseSerialize: (message: CreateOrderResponse) => Buffer.from(message.serialize()),
                responseDeserialize: (bytes: Buffer) => CreateOrderResponse.deserialize(new Uint8Array(bytes))
            }
        };
        [method: string]: grpc_1.UntypedHandleCall;
        abstract CreateOrder(call: grpc_1.ServerUnaryCall<CreateOrderRequest, CreateOrderResponse>, callback: grpc_1.sendUnaryData<CreateOrderResponse>): void;
    }
    export class OrderManagerClient extends grpc_1.makeGenericClientConstructor(UnimplementedOrderManagerService.definition, "OrderManager", {}) {
        constructor(address: string, credentials: grpc_1.ChannelCredentials, options?: Partial<grpc_1.ChannelOptions>) {
            super(address, credentials, options);
        }
        CreateOrder: GrpcPromiseServiceInterface<CreateOrderRequest, CreateOrderResponse> = (message: CreateOrderRequest, metadata?: grpc_1.Metadata | grpc_1.CallOptions, options?: grpc_1.CallOptions): Promise<CreateOrderResponse> => { if (!metadata) {
            metadata = new grpc_1.Metadata;
        } if (!options) {
            options = {};
        } return new Promise((resolve, reject) => super.CreateOrder(message, metadata, options, (error: grpc_1.ServiceError, response: CreateOrderResponse) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(response);
            }
        })); };
    }
}