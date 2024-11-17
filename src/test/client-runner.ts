import Log, { Logger } from "@rbxts/log";
import { Players } from "@rbxts/services";

import { ZirconClientConfigurationBuilder } from "Class/ZirconClientConfigurationBuilder";
import { $package } from "rbxts-transform-debug";

import { Log as ZirconLog, ZirconClient, ZirconFunctionBuilder } from "..";

Log.SetLogger(
	Logger.configure()
		.WriteTo(ZirconLog.Console())
		.EnrichWithProperty("Version", $package.version)
		.Create(),
);

ZirconClient.Init({
	EnableTags: true,
	Keys: [Enum.KeyCode.Backquote, Enum.KeyCode.F10],
	Theme: "Plastic",
});

Promise.delay(10)
	.then(() => {
		Log.Verbose("Verbose message pls");
		Log.Info("Hello, {Test}! {Boolean} {Number} {Array}", "Test string", true, 10, [
			1,
			2,
			3,
			[4],
		]);
		Log.Info("Should be good {Number}", 1);
		Log.Info(
			`String {String}, Number {Number}, Boolean {Boolean}, Array: {Array}, Map: {Map}, Instance: {Instance}, Undefined: {Undefined}, None: {None}`,
			"Hello, World!",
			1337,
			true,
			[1, "two", true],
			{ value: "hi" },
			Players.LocalPlayer,
			undefined,
		);
		Log.Debug("test", "testing debug");
		Log.Warn("test warning lol");
		Log.Error("test error lol");
		Log.Fatal("wtf lol");
	})
	.catch(err => {
		throw `This shouldn't happen. ${err}`;
	});

ZirconClient.Registry.Init(
	new ZirconClientConfigurationBuilder()
		.AddFunction(
			new ZirconFunctionBuilder("version").Bind(context => {
				context.LogInfo($package.version);
			}),
		)
		.Build(),
);
