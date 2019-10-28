const RLPMock = artifacts.require('RLPMock');
const { expectRevert } = require('openzeppelin-test-helpers');
const tests = require('./fixture/invalidRLPTest.json');

const STRING_SHORT_START = 0x80;
const STRING_LONG_START = 0xb8;
const LIST_SHORT_START = 0xc0;
const LIST_LONG_START = 0xf8;

// Using test fixtures from https://github.com/ethereum/tests/blob/develop/RLPTests/invalidRLPTest.json
contract('RLP invalid tests', () => {
    before(async () => {
        this.rlp = await RLPMock.new();
    });

    const decode = async (encoded) => {
        const firstByte = parseInt(encoded.substring(0, 4), 16);
        if (firstByte < STRING_SHORT_START) {
            return this.rlp.decodeUint(encoded);
        }
        if (firstByte < STRING_LONG_START) {
            return this.rlp.decodeString(encoded);
        }
        if (firstByte < LIST_SHORT_START) {
            return this.rlp.decodeString(encoded);
        }
        const decoded = await this.rlp.decodeList(encoded);
        return Promise.all(decoded.map(elem => decode(elem)));
    };

    Object.keys(tests).forEach((testName) => {
        it(`should revert on invalid test ${testName}`, async () => {
            const encoded = tests[testName].out;

            if (testName.includes('stringListInvalidEncodedLength')) {
                await expectRevert(this.rlp.decodeList(encoded), 'Decoded RLP length for list is invalid');
            } else if (testName.includes('stringListInvalidEncodedItemLength')) {
                await expectRevert(this.rlp.decodeList(encoded), 'Invalid decoded length of RLP item found during counting items in a list');
            } else if (testName.includes('shortStringInvalidEncodedLength')) {
                await expectRevert(this.rlp.decodeUint(encoded), 'Decoded length is greater than input data');
            } else if (testName.includes('wrongEmptyString')) {
                await expectRevert(this.rlp.decodeUint(encoded), 'Item length must be between 1 and 33 bytes');
            } else if (testName.includes('invalidAddress')) {
                await expectRevert(this.rlp.decodeBytes20(encoded), 'Item length must be 21');
            } else {
                await expectRevert(decode(encoded), 'Invalid RLP encoding');
            }
        });
    });
});
