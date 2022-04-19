const { assert } = require('chai');

const DappToken = artifacts.require("DappToken");
const DaiToken = artifacts.require("DaiToken");
const TokenFarm = artifacts.require("TokenFarm");

require('chai').use(
    require('chai-as-promised')
).should()

const convertTokens = (num) => {
    return web3.utils.toWei(num, 'ether')
}

contract('TokenFarm', (accounts) => {
    let daiToken;
    let dappToken;
    let tokenFarm;

    before(async () => {
        daiToken = await DaiToken.new();
        dappToken = await DappToken.new();
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address);

        // Transfer
        await dappToken.transfer(tokenFarm.address, convertTokens('1000000'))
        await daiToken.transfer(accounts[1], convertTokens('100'), { from: accounts[0] })
    });

    describe('Dai Deployment', async () => {
        it('has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, "Mock DAI Token")
        })
    })

    describe('Dapp Deployment', async () => {
        it('has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, "DApp Token")
        })
    })

    describe('Token Farm Deployment', async () => {
        it('has a name', async () => {
            const name = await tokenFarm.name()
            assert.equal(name, "Dapp Token Farm")
        })

        it('contract has tokens', async () => {
            const balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), convertTokens('1000000'))
        })
    })

    describe('Farming Tokens', async () => {
        it('rewards investors for staking tokens', async () => {
            const result = await daiToken.balanceOf(accounts[1])
            assert.equal(result.toString(), convertTokens('100'))

            await daiToken.approve(tokenFarm.address, convertTokens('100'), { from: accounts[1] })
            await tokenFarm.stakeTokens(convertTokens('100'), { from: accounts[1] })

            const tokens = await daiToken.balanceOf(accounts[1])
            assert.equal(tokens.toString(), convertTokens('0'))

            const stake = await tokenFarm.stakingBalance(accounts[1])
            assert.equal(stake.toString(), convertTokens('100'))

            const status = await tokenFarm.isStaking(accounts[1])
            assert.equal(status.toString(), 'true')

            await tokenFarm.issueTokens({ from: accounts[0] })
            const balance = await dappToken.balanceOf(accounts[1])
            assert.equal(balance.toString(), convertTokens('100'))

            await tokenFarm.issueTokens({ from: accounts[1] }).should.be.rejected;

            await tokenFarm.unstakeTokens({ from: accounts[1] })

            const unStake = await daiToken.balanceOf(accounts[1])
            assert.equal(unStake.toString(), convertTokens('100'))

            const farmTokens = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(farmTokens.toString(), convertTokens('0'))

            const investor = await tokenFarm.stakingBalance(accounts[1])
            assert.equal(investor.toString(), convertTokens('0'))

            const newStatus = await tokenFarm.isStaking(accounts[1])
            assert.equal(newStatus.toString(), 'false')
        })
    })

})