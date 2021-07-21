"use strict";
var NodeType;
(function (NodeType) {
    NodeType[NodeType["Input"] = 0] = "Input";
    NodeType[NodeType["Output"] = 1] = "Output";
    NodeType[NodeType["Hidden"] = 2] = "Hidden";
})(NodeType || (NodeType = {}));
function printList(list) {
    console.log(`[${list.join(', ')}]`);
}
function nodeTypeStr(type) {
    switch (type) {
        case NodeType.Input:
            return 'input';
        case NodeType.Output:
            return 'output';
        case NodeType.Hidden:
            return 'hidden';
        default:
            return 'unknown';
    }
}
function printNode(node) {
    const str = `[id-${node.id}: ${nodeTypeStr(node.type)}] v: ${node.value}`;
    console.log(str);
}
function printNodeList(list) {
    list.forEach((node) => printNode(node));
}
function randomFrom(list) {
    const index = Math.floor(Math.random() * list.length);
    return list[index];
}
function randomChance(chance) {
    const rand = Math.random();
    return rand <= chance;
}
function randomFloat(a, b) {
    let min = Math.min(a, b);
    let max = Math.max(a, b);
    return (Math.random() * (max - min)) + min;
}
function printLink(link) {
    const enabledStr = link.enabled ? 'enabled' : 'disabled';
    const str = `[inno-${link.inno}] [${enabledStr}] [${link.in} -> ${link.out}] w: ${link.weight}`;
    console.log(str);
}
function printLinkList(list) {
    list.forEach((link) => printLink(link));
}
// Squash functions
const squashFunctions = {
    Linear: (val) => val,
    Sigmoid: (val) => 1 / (1 + Math.exp(-val)),
    NEATSigmoid: (val) => 1 / (1 + Math.exp(-4.9 * val)),
    SignedSigmoid: (val) => (2 / (1 + Math.exp(-val))) - 1,
    Relu: (val) => val > 0 ? val : 0
};
class Network {
    constructor(config) {
        this.fitness = 0;
        this.adjustedFitness = 0;
        this.offspring = 0;
        this.inputs = config.inputs;
        this.outputs = config.outputs;
        this.config = config;
        this.nodes = [];
        this.links = [];
        this.graphicalLayers = [];
        for (let i = 0; i < this.inputs; i++) {
            this.nodes.push({ type: NodeType.Input, value: 0, id: this.nodes.length });
            this.graphicalLayers.push(-1);
        }
        for (let i = 0; i < this.outputs; i++) {
            this.nodes.push({ type: NodeType.Output, value: 0, id: this.nodes.length });
            this.graphicalLayers.push(Infinity);
        }
    }
    copy() {
        let net = new Network(this.config);
        net.fitness = this.fitness;
        net.adjustedFitness = this.adjustedFitness;
        this.nodes.forEach((node, i) => {
            if (node.type == NodeType.Hidden) {
                net.nodes.push(JSON.parse(JSON.stringify(node)));
                net.graphicalLayers.push(this.graphicalLayers[i]);
            }
        });
        this.links.forEach(link => {
            net.links.push(JSON.parse(JSON.stringify(link)));
        });
        return net;
    }
    maxInno() {
        if (this.links.length == 0)
            return 0;
        const inno_numbers = this.links.map((link) => link.inno);
        return Math.max(...inno_numbers);
    }
    minInno() {
        if (this.links.length == 0)
            return 0;
        const inno_numbers = this.links.map((link) => link.inno);
        return Math.min(...inno_numbers);
    }
    getNodesOfType(type) {
        return this.nodes.filter((node) => node.type == type);
    }
    mutateWeights() {
        this.links.forEach(link => {
            if (randomChance(0.10)) {
                // Change to random weight
                const newWeight = randomFloat(this.config.randomWeightRange.min, this.config.randomWeightRange.max);
                link.weight = newWeight;
            }
            else {
                // Perturb weight
                const delta = randomFloat(-this.config.perturbAmount, this.config.perturbAmount);
                link.weight += delta;
            }
        });
    }
    mutateAddNode(global_inno) {
        if (this.links.length == 0) {
            throw 'no links to add node to';
        }
        const linkToSplice = randomFrom(this.links);
        const inNode = this.nodes[linkToSplice.in];
        const outNode = this.nodes[linkToSplice.out];
        // Add node
        const middleNode = { type: NodeType.Hidden, value: 0, id: this.nodes.length };
        this.nodes.push(middleNode);
        const newLayer = this.graphicalLayers[inNode.id] + 1;
        this.graphicalLayers.push(newLayer);
        // Disable old link
        linkToSplice.enabled = false;
        // Add Links
        const link1 = { in: inNode.id, out: middleNode.id, weight: 1, enabled: true, inno: global_inno + 1 };
        const link2 = { in: middleNode.id, out: outNode.id, weight: linkToSplice.weight, enabled: true, inno: global_inno + 2 };
        this.links.push(link1, link2);
        return global_inno + 2;
    }
    mutateAddLink(global_inno) {
        const weight = randomFloat(this.config.randomWeightRange.min, this.config.randomWeightRange.max);
        const tries = 3;
        for (let i = 0; i < tries; i++) {
            let inNode = randomFrom(this.nodes.filter(node => node.type != NodeType.Output));
            let outgoingLinks = this.getOutputLinks(inNode.id);
            let possibleOutNodes = this.nodes.filter(node => {
                if (node.type == NodeType.Input)
                    return false;
                if (node.id == inNode.id)
                    return false;
                if (outgoingLinks.findIndex(link => link.out == node.id) != -1)
                    return false;
                return true;
            });
            if (possibleOutNodes.length > 0) {
                let outNode = randomFrom(possibleOutNodes);
                return this.addLink(global_inno, inNode.id, outNode.id, weight);
            }
        }
        return global_inno;
    }
    addLink(global_inno, input, output, weight) {
        let inNode = this.nodes[input];
        let outNode = this.nodes[output];
        if (inNode.type == NodeType.Output) {
            throw 'inNode type is output';
        }
        if (outNode.type == NodeType.Input) {
            throw 'outNode type is input';
        }
        let new_inno = global_inno + 1;
        let link = {
            in: input,
            out: output,
            weight: weight,
            enabled: true,
            inno: new_inno
        };
        this.links.push(link);
        return new_inno;
    }
    hasLink(inno) {
        return this.links.findIndex((link) => link.inno == inno) != -1;
    }
    getLink(inno) {
        return this.links.find((link) => link.inno == inno);
    }
    getOutputLinks(id) {
        return this.links.filter((link) => link.in == id);
    }
    getInputLinks(id) {
        return this.links.filter((link) => link.out == id);
    }
    getInputNodes(id) {
        return this.getInputLinks(id).map((link) => this.nodes[link.in]);
    }
    getInputValues(id) {
        return this.getInputLinks(id).map((link) => this.nodes[link.in].value);
    }
    evalOnce(input) {
        this.nodes.forEach((node) => {
            node.value = 0;
        });
        return this.eval(input);
    }
    eval(input) {
        if (input.length != this.inputs) {
            throw 'wrong number of inputs';
        }
        // Set input nodes
        this.getNodesOfType(NodeType.Input).forEach((node, index) => {
            node.value = input[index];
        });
        for (let t = 0; t < this.config.evalIterations; t++) {
            this.nodes.forEach((node) => {
                let inputLinks = this.getInputLinks(node.id);
                let inputValues = this.getInputValues(node.id);
                if (inputLinks.length != inputValues.length) {
                    throw 'inputLink length != inputValue length';
                }
                if (inputLinks.length > 0) {
                    // Sum
                    var sum = 0;
                    for (let i = 0; i < inputLinks.length; i++) {
                        if (inputLinks[i].enabled) {
                            let weight = inputLinks[i].weight;
                            let value = inputValues[i];
                            sum += weight * value;
                        }
                    }
                    // Squash and set value
                    node.value = this.config.squash(sum);
                }
            });
        }
        return this.getNodesOfType(NodeType.Output).map((node) => node.value);
    }
    print() {
        console.log('-- NETWORK --');
        console.log('Nodes:');
        this.nodes.forEach((node, i) => {
            printNode(node);
        });
        console.log();
        console.log('Links:');
        this.links.forEach((link) => {
            printLink(link);
        });
        console.log('-------------');
    }
    p5Draw(config, filename) {
        new p5((p) => {
            const getNumLayers = () => {
                let hiddenLayers = this.graphicalLayers.filter((layer) => (layer != -1 && layer != Infinity));
                if (hiddenLayers.length == 0) {
                    return 2;
                }
                return 3 + Math.max(...hiddenLayers);
            };
            const numLayers = getNumLayers();
            const padding = config.nodeSize;
            const availableWidth = config.width - (padding * 2);
            const availableHeight = config.height - (padding * 2);
            var hiddenLayerCount = [];
            var nextLayerVert = [];
            var nextInputVert = padding;
            var nextOutputVert = padding;
            for (let i = 0; i < (numLayers - 2); i++) {
                hiddenLayerCount.push(0);
                nextLayerVert.push(padding);
            }
            this.graphicalLayers.forEach((layerIndex) => {
                if (layerIndex != -1 && layerIndex != Infinity) {
                    hiddenLayerCount[layerIndex] += 1;
                }
            });
            const maxNodesInLayer = Math.max(this.inputs, this.outputs, ...hiddenLayerCount);
            const layerSpacing = availableWidth / (numLayers - 1);
            const verticalSpacing = (availableHeight / (maxNodesInLayer - 1));
            const getLayerX = (layer) => {
                if (layer == -1)
                    return padding;
                if (layer == Infinity)
                    return config.width - padding;
                return padding + (layerSpacing * (layer + 1));
            };
            var nodePositions = [];
            this.nodes.forEach((node, index) => {
                let associatedLayer = this.graphicalLayers[index];
                let x = getLayerX(associatedLayer);
                let y = 0;
                switch (node.type) {
                    case NodeType.Input:
                        y = nextInputVert;
                        nextInputVert += verticalSpacing;
                        break;
                    case NodeType.Output:
                        y = nextOutputVert;
                        nextOutputVert += verticalSpacing;
                        break;
                    case NodeType.Hidden:
                        y = nextLayerVert[associatedLayer];
                        nextLayerVert[associatedLayer] += verticalSpacing;
                        break;
                }
                nodePositions.push({ x: x, y: y });
            });
            const blue = p.color(0, 0, 255);
            const orange = p.color(255, 100, 0);
            const green = p.color(0, 255, 0);
            const red = p.color(255, 0, 0);
            const black = p.color(0);
            const grey = p.color(120);
            const white = p.color(255);
            const drawNode = (node) => {
                const color = node.type == NodeType.Input ? green : (node.type == NodeType.Output ? orange : blue);
                const position = nodePositions[node.id];
                p.fill(color);
                p.stroke(black);
                p.strokeWeight(config.nodeStroke);
                p.circle(position.x, position.y, config.nodeSize);
            };
            const drawLink = (link) => {
                let color = black;
                if (!link.enabled) {
                    color = grey;
                }
                else if (link.weight > 0) {
                    color = blue;
                }
                else if (link.weight < 0) {
                    color = red;
                }
                else if (link.weight == 0) {
                    color = black;
                }
                let inPos = nodePositions[link.in];
                let outPos = nodePositions[link.out];
                p.stroke(color);
                p.strokeWeight(config.linkWidth);
                p.line(inPos.x, inPos.y, outPos.x, outPos.y);
            };
            p.setup = () => {
                p.createCanvas(config.width, config.height);
                p.noLoop();
                p.noStroke();
            };
            p.draw = () => {
                p.background(white);
                // Draw Links
                if (config.showDisabled) {
                    this.links.filter((link) => !link.enabled).forEach((link) => drawLink(link));
                    this.links.filter((link) => link.enabled).forEach((link) => drawLink(link));
                }
                else {
                    this.links.filter((link) => link.enabled).forEach((link) => drawLink(link));
                }
                // Draw Nodes
                this.nodes.forEach((node) => drawNode(node));
                fs.promises.writeFile(filename, p.canvas.toBuffer());
            };
        });
    }
}
class NEAT {
    constructor(config) {
        this.config = config;
        this.globalInno = 1;
        this.pop = [];
        for (let i = 0; i < config.popSize; i++) {
            this.pop.push(new Network(config.netConfig));
            // for (let j = 0; j < config.startingWeights; j++) {
            //     this.pop[i].mutateAddLink(this.globalInno)
            // }
            this.pop[i].links = [
                { inno: 1, in: 0, out: 3, weight: randomFloat(-1, 1), enabled: true },
                { inno: 2, in: 0, out: 3, weight: randomFloat(-1, 1), enabled: true },
                { inno: 3, in: 0, out: 3, weight: randomFloat(-1, 1), enabled: true },
            ];
        }
    }
    getDistance(net1, net2) {
        const maxInno = Math.max(net1.maxInno(), net2.maxInno());
        const minInno = Math.min(net1.minInno(), net2.minInno());
        const excessStartCutoff = Math.max(net1.minInno(), net2.minInno());
        const excessEndCutoff = Math.min(net1.maxInno(), net2.maxInno());
        let excess = 0;
        let disjoint = 0;
        let weightDiffs = [];
        for (let i = 1; i <= maxInno; i++) {
            if (net1.hasLink(i) != net2.hasLink(i)) {
                if (i < excessStartCutoff || i > excessEndCutoff) {
                    excess += 1;
                }
                else {
                    disjoint += 1;
                }
            }
            else if (net1.hasLink(i) && net2.hasLink(i)) {
                const weight1 = net1.getLink(i).weight;
                const weight2 = net2.getLink(i).weight;
                weightDiffs.push(Math.abs(weight1 - weight2));
            }
        }
        let W = 0;
        if (weightDiffs.length > 0) {
            let sum = 0;
            weightDiffs.forEach(diff => sum += diff);
            W = sum / weightDiffs.length;
        }
        let N = Math.max(net1.links.length, net2.links.length);
        //if (N < 20) N = 1
        return (this.config.c1 * (excess / N)) + (this.config.c2 * (disjoint / N)) + (this.config.c3 * W);
    }
    breed(parent1, parent2) {
        let fitParent;
        if (parent1.fitness > parent2.fitness) {
            fitParent = parent1;
        }
        else {
            fitParent = parent2;
        }
        // For matching genes, inherit randomly from either parent
        // For excess and disjoint genes, inherit from more fit parent
        let child = new Network(parent1.config);
        // Add links
        const minInno = Math.min(parent1.minInno(), parent2.minInno());
        const maxInno = Math.max(parent1.maxInno(), parent2.maxInno());
        for (let i = minInno; i <= maxInno; i++) {
            // Matching
            if (parent1.hasLink(i) && parent2.hasLink(i)) {
                let randomParent = randomFrom([parent1, parent2]);
                child.links.push(JSON.parse(JSON.stringify(randomParent.getLink(i))));
            }
            else if (fitParent.hasLink(i)) {
                child.links.push(JSON.parse(JSON.stringify(fitParent.getLink(i))));
            }
        }
        // Add nodes
        let highestID = 0;
        child.links.forEach(link => {
            if (link.in > highestID) {
                highestID = link.in;
            }
            if (link.out > highestID) {
                highestID = link.out;
            }
        });
        while (child.nodes.length <= highestID) {
            child.nodes.push({ type: NodeType.Hidden, value: 0, id: child.nodes.length });
        }
        // Add node locations
        child.graphicalLayers = [];
        for (let i = 0; i < child.nodes.length; i++) {
            if (i < parent1.graphicalLayers.length) {
                child.graphicalLayers.push(parent1.graphicalLayers[i]);
            }
            else if (i < parent2.graphicalLayers.length) {
                child.graphicalLayers.push(parent2.graphicalLayers[i]);
            }
        }
        if (child.graphicalLayers.length != child.nodes.length) {
            throw 'lengths are different';
        }
        return child;
    }
    speciate() {
        let species = [];
        let reps = [];
        this.pop.forEach(network => {
            for (let i = 0; i < reps.length; i++) {
                const rep = reps[i];
                const distance = this.getDistance(network, rep);
                if (distance <= this.config.deltaThresh) {
                    species[i].push(network);
                    return;
                }
            }
            // No species fit. Create new one
            reps.push(network);
            species.push([network]);
        });
        console.log('    Species: ' + species.map(elem => elem.length).join(' '));
        // Assign adjusted fitnesses
        for (let i = 0; i < species.length; i++) {
            const n = species[i].length;
            species[i].forEach(network => {
                network.adjustedFitness = (100 * network.fitness) / n;
            });
        }
        return species;
        //console.log('[' + this.pop.map(net => Math.round(net.adjustedFitness * 100)/100).join(', ') + ']')
    }
    mutateChild(childNetwork) {
        if (randomChance(this.config.changeWeightsChance)) {
            childNetwork.mutateWeights();
        }
        if (randomChance(this.config.addLinkChance)) {
            this.globalInno = childNetwork.mutateAddLink(this.globalInno);
        }
        if (randomChance(this.config.addNodeChance) && childNetwork.links.length > 0) {
            this.globalInno = childNetwork.mutateAddNode(this.globalInno);
        }
    }
    printGroup(group) {
        console.log(`Fitness: [${group.map(n => Math.round(n.fitness * 100) / 100).join(' ')}]`);
    }
    printAdjGroup(group) {
        console.log(`Adj: [${group.map(n => Math.round(n.adjustedFitness * 100) / 100).join(' ')}]`);
    }
    bestFitness(group) {
        let best = group[0];
        group.forEach(network => {
            if (network.fitness > best.fitness) {
                best = network;
            }
        });
        return best;
    }
    bestAdjustedFitness(group) {
        let best = group[0];
        group.forEach(network => {
            if (network.adjustedFitness > best.adjustedFitness) {
                best = network;
            }
        });
        return best;
    }
    reproduceAdjusted() {
        let species = this.speciate();
        this.pop.sort((a, b) => {
            if (a.adjustedFitness < b.adjustedFitness) {
                return 1;
            }
            if (a.adjustedFitness > b.adjustedFitness) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
        let champions = [];
        species.forEach(group => {
            group.sort((a, b) => {
                if (a.adjustedFitness < b.adjustedFitness) {
                    return 1;
                }
                if (a.adjustedFitness > b.adjustedFitness) {
                    return -1;
                }
                // a must be equal to b
                return 0;
            });
            if (group.length > 5) {
                champions.push(this.bestFitness(group));
            }
        });
        let availableOffspring = this.pop.length - champions.length;
        let adjSum = 0;
        this.pop.forEach(net => {
            adjSum += net.adjustedFitness;
        });
        let fitnessPerOffspring = adjSum / availableOffspring;
        let totalOffspring = 0;
        this.pop.forEach(net => {
            const offspring = Math.ceil(net.adjustedFitness / fitnessPerOffspring);
            net.offspring = offspring;
            totalOffspring += offspring;
        });
        let toRemove = totalOffspring - availableOffspring;
        for (let i = this.pop.length - 1; i > this.pop.length - 1 - toRemove; i--) {
            this.pop[i].offspring -= 1;
        }
        // Create next generation
        let nextPop = [];
        // Add champions
        champions.forEach(champion => nextPop.push(champion.copy()));
        // Reproduction
        species.forEach((spec, i) => {
            spec.forEach(net => {
                const children = net.offspring;
                for (let j = 0; j < children; j++) {
                    let childNetwork;
                    if (randomChance(1)) {
                        childNetwork = net.copy();
                    }
                    else {
                        // Select parent from species
                        let otherParent;
                        if (randomChance(0.005)) {
                            otherParent = randomFrom(this.pop);
                        }
                        else {
                            otherParent = randomFrom(species[i]);
                        }
                        childNetwork = this.breed(net, otherParent);
                    }
                    this.mutateChild(childNetwork);
                    nextPop.push(childNetwork);
                }
            });
        });
        this.pop = nextPop;
    }
    reproduce() {
        // Sort pop by fitness
        this.pop.sort((a, b) => {
            if (a.fitness < b.fitness) {
                return 1;
            }
            if (a.fitness > b.fitness) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
        //console.log('Fitness: ' + this.pop[0].fitness + ', adj: ' + this.pop[0].adjustedFitness)
        //this.print()
        let offspring = [];
        let fitnessSum = 0;
        this.pop.forEach(network => {
            fitnessSum += network.fitness;
        });
        let fitnessPerOffspring = fitnessSum / this.pop.length;
        this.pop.forEach((network, i) => {
            const offspringCount = Math.floor(network.fitness / fitnessPerOffspring);
            offspring.push(offspringCount);
        });
        let offspringSum = 0;
        offspring.forEach(o => {
            offspringSum += o;
        });
        let remaining = this.config.popSize - offspringSum;
        for (let i = 0; i < remaining; i++) {
            offspring[i] += 1;
        }
        offspringSum = 0;
        offspring.forEach(o => {
            offspringSum += o;
        });
        const keepBest = 5;
        // Make new population
        let newPop = [];
        for (let i = 0; i < this.pop.length; i++) {
            const parentNetwork = this.pop[i];
            const offspringCount = offspring[i];
            for (let j = 0; j < offspringCount; j++) {
                let childNetwork = parentNetwork.copy();
                if (!(i <= keepBest && j == 0)) {
                    if (randomChance(this.config.changeWeightsChance)) {
                        childNetwork.mutateWeights();
                    }
                    if (randomChance(this.config.addLinkChance)) {
                        this.globalInno = childNetwork.mutateAddLink(this.globalInno);
                    }
                    if (randomChance(this.config.addNodeChance) && childNetwork.links.length > 0) {
                        this.globalInno = childNetwork.mutateAddNode(this.globalInno);
                    }
                }
                newPop.push(childNetwork);
            }
        }
        this.pop = newPop;
    }
    print() {
        console.log('[' + this.pop.map(net => Math.round(net.fitness * 100) / 100).join(', ') + ']');
    }
}
function evalXOR(network) {
    const inputs = [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
    const expectedSet = [0, 1, 1, 0];
    const errorSet = [];
    inputs.forEach((input, index) => {
        const expected = expectedSet[index];
        const got = network.evalOnce(input)[0];
        const error = Math.pow((expected - got), 2);
        errorSet.push(error);
    });
    let sum = 0;
    errorSet.forEach(error => sum += error);
    network.fitness = 1 - (sum / errorSet.length);
}
function XORSuccess(network) {
    const inputs = [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
    const expectedSet = [0, 1, 1, 0];
    const gotSet = [];
    inputs.forEach((input, index) => {
        const got = Math.round(network.evalOnce(input)[0]);
        gotSet.push(got);
    });
    for (let i = 0; i < 4; i++) {
        const expected = expectedSet[i];
        const got = gotSet[i];
        if (expected != got)
            return false;
    }
    return true;
}
const netConfig = {
    inputs: 3,
    outputs: 1,
    squash: squashFunctions.NEATSigmoid,
    evalIterations: 3,
    randomWeightRange: { min: -1, max: 1 },
    perturbAmount: 0.2,
};
const neatConfig = {
    popSize: 150,
    netConfig: netConfig,
    startingWeights: 0,
    c1: 1,
    c2: 1,
    c3: 0.4,
    deltaThresh: 2.0,
    addLinkChance: 0.05,
    addNodeChance: 0.03,
    changeWeightsChance: 0.8,
};
// const neat = new NEAT(neatConfig)
// const iterations = 10000
// let bestFitness = 0
// let bestAdj = 0
// let gen = 0
// while (!XORSuccess(neat.bestFitness(neat.pop)) && gen < iterations) {
//     gen += 1   
//     neat.pop.forEach(network => evalXOR(network))
//     console.log('GEN ' + gen)
//     neat.reproduceAdjusted()
//     // neat.speciate()
//     // neat.reproduce()
//     bestFitness = neat.bestFitness(neat.pop).fitness
//     bestAdj = neat.bestAdjustedFitness(neat.pop).adjustedFitness
//     console.log('    Best: ' + bestFitness)
//     console.log('    BestAdj: ' + bestAdj)
//     console.log()
// }
// const config: DrawConfig = {
//     width: 500,
//     height: 500,
//     nodeSize: 40,
//     nodeStroke: 2,
//     linkWidth: 2,
//     showDisabled: false,
// }
// const best = neat.bestFitness(neat.pop)
// best.p5Draw(config, path.join(__dirname, "..", "net.png"))
// best.print()
// printList(best.graphicalLayers)
// module.exports = {
//     Network: Network,
//     NEAT: NEAT,
//     printList: printList,
// };
//# sourceMappingURL=network.js.map