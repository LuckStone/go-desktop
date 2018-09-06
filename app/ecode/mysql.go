package ecode


const (
	SUCCESS     int = 0 // success
	IgnoredCode int = 99

	/* common 1000~1999 */
	EcodeParameterError         = 1000
	EcodeRequestDecodeError     = 1001
	EcodeRequestEncodeError     = 1002
	EcodeDriverNameError        = 1003
	EcodeLockMetadataError      = 1004
	EcodeMarshalJSONError       = 1005
	EcodeUnmarshalJSONError     = 1006
	EcodeIpAddressInvalid       = 1007
	EcodeIpAddressNotFound      = 1008
	EcodeDriverNameInvalid      = 1009
	EcodeEncodeDecodeError      = 1010
	EcodeDaemonInitError        = 1012
	EcodeSystemCommandNotFound  = 1013
	EcodeSystemCommandRunError  = 1014
	EcodeDriverNotSupport       = 1015 //TODO: 现只支持COMET
	EcodeGetLocalIpError        = 1016
	EcodeDataIsNil              = 1017
	EcodeUnlockMetadataError    = 1050
	EcodeTcpConnectionError     = 1100
	EcodeInitTcpConnectionError = 1101
	EcodeTcpDataError           = 1102
	EcodeMachineMisconfig       = 1103
	EcodePackListCountTooBig    = 1104
	EcodeParseIPError           = 1105
	EcodeParseCIDRError         = 1106
	EcodeParseMACError          = 1107
	/* common */
)
