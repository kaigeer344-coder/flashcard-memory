/**
 * 极简词黑名单 (Basic Stoplist)
 * 来源:New General Service List (NGSL) + 通用英文功能词
 * 用途:从学习池中剔除,不论词频多高
 *
 * 设计原则:
 * - 包含英文中最常见的功能词(the/a/is/are/of 等)
 * - 包含基础日常词(have/go/come/get 等过于简单的词)
 * - 不剔除有专业含义的词(如 have 在 "have to" 中作为基础词,但 "have" 单独不剔除)
 * - 用户已学过的词不剔除(由调用方负责过滤)
 *
 * 维护方式:每个词小写,以 Set 形式存储,O(1) 查询
 */

(function () {
    const STOPWORDS = [
        // 冠词
        'a', 'an', 'the',
        // 代词 - 主格
        'i', 'you', 'he', 'she', 'it', 'we', 'they',
        // 代词 - 宾格
        'me', 'him', 'her', 'us', 'them',
        // 代词 - 所有格
        'my', 'your', 'his', 'its', 'our', 'their',
        'mine', 'yours', 'hers', 'ours', 'theirs',
        // 反身代词
        'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves',
        // 指示代词
        'this', 'that', 'these', 'those',
        // 疑问代词
        'who', 'whom', 'whose', 'which', 'what', 'where', 'when', 'why', 'how',
        // 不定代词
        'all', 'another', 'any', 'anybody', 'anyone', 'anything', 'both', 'each', 'either',
        'everybody', 'everyone', 'everything', 'few', 'many', 'neither', 'nobody', 'none',
        'no one', 'nothing', 'one', 'other', 'others', 'several', 'some', 'somebody',
        'someone', 'something', 'such',
        // 关系代词
        'whoever', 'whomever', 'whichever', 'whatever',
        // be 动词
        'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
        // 助动词
        'have', 'has', 'had', 'having',
        'do', 'does', 'did', 'doing', 'done',
        'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'ought',
        // 介词 - 单字
        'in', 'on', 'at', 'to', 'of', 'for', 'by', 'with', 'from', 'up', 'down', 'out',
        'off', 'over', 'under', 'into', 'onto', 'upon', 'than', 'as', 'or', 'but',
        // 介词 - 复合
        'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around', 'before',
        'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'during', 'except',
        'inside', 'near', 'outside', 'since', 'through', 'throughout', 'toward', 'towards',
        'until', 'within', 'without', 'despite', 'via', 'per',
        // 连词
        'and', 'nor', 'yet', 'so', 'if', 'then', 'because', 'although', 'though', 'unless',
        'until', 'while', 'whereas', 'whether', 'once', 'since', 'supposing',
        // 冠词性限定词
        'some', 'any', 'no', 'each', 'every', 'either', 'neither', 'both', 'all', 'half',
        // 程度副词
        'very', 'too', 'quite', 'rather', 'pretty', 'fairly', 'somewhat', 'almost',
        'nearly', 'hardly', 'scarcely', 'barely', 'just', 'only', 'even', 'still',
        // 时间副词
        'now', 'then', 'today', 'tomorrow', 'yesterday', 'soon', 'later', 'already',
        'yet', 'always', 'usually', 'often', 'sometimes', 'never', 'ever', 'recently',
        'currently', 'finally', 'eventually', 'suddenly', 'immediately', 'shortly',
        // 地点副词
        'here', 'there', 'everywhere', 'nowhere', 'somewhere', 'anywhere',
        // 方式副词
        'well', 'fast', 'hard', 'easy', 'slowly', 'quickly', 'really',
        // 否定词
        'not', 'no', 'never', 'none', 'nobody', 'nothing', 'nowhere', 'neither', 'nor',
        // 数量词
        'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        'first', 'second', 'third', 'once', 'twice', 'three',
        // 常见动词(过于基础的)
        'get', 'got', 'gotten', 'getting',
        'go', 'goes', 'went', 'gone', 'going',
        'come', 'came', 'coming',
        'make', 'made', 'making',
        'take', 'took', 'taken', 'taking',
        'give', 'gave', 'given', 'giving',
        'see', 'saw', 'seen', 'seeing',
        'know', 'knew', 'known', 'knowing',
        'think', 'thought', 'thinking',
        'say', 'said', 'saying',
        'tell', 'told', 'telling',
        'ask', 'asked', 'asking',
        'find', 'found', 'finding',
        'feel', 'felt', 'feeling',
        'try', 'tried', 'trying',
        'leave', 'left', 'leaving',
        'call', 'called', 'calling',
        'want', 'wanted', 'wanting',
        'seem', 'seemed', 'seeming',
        'show', 'showed', 'shown', 'showing',
        'run', 'ran', 'running',
        'move', 'moved', 'moving',
        'live', 'lived', 'living',
        'believe', 'believed', 'believing',
        'hold', 'held', 'holding',
        'bring', 'brought', 'bringing',
        'happen', 'happened', 'happening',
        'write', 'wrote', 'written', 'writing',
        'sit', 'sat', 'sitting',
        'stand', 'stood', 'standing',
        'lose', 'lost', 'losing',
        'pay', 'paid', 'paying',
        'meet', 'met', 'meeting',
        'include', 'included', 'including',
        'continue', 'continued', 'continuing',
        'set', 'setting',
        'learn', 'learned', 'learnt', 'learning',
        'change', 'changed', 'changing',
        'lead', 'led', 'leading',
        'understand', 'understood', 'understanding',
        'watch', 'watched', 'watching',
        'follow', 'followed', 'following',
        'stop', 'stopped', 'stopping',
        'create', 'created', 'creating',
        'speak', 'spoke', 'spoken', 'speaking',
        'read', 'reading',
        'spend', 'spent', 'spending',
        'grow', 'grew', 'grown', 'growing',
        'open', 'opened', 'opening',
        'walk', 'walked', 'walking',
        'win', 'won', 'winning',
        'offer', 'offered', 'offering',
        'remember', 'remembered', 'remembering',
        'love', 'loved', 'loving',
        'consider', 'considered', 'considering',
        'appear', 'appeared', 'appearing',
        'buy', 'bought', 'buying',
        'wait', 'waited', 'waiting',
        'serve', 'served', 'serving',
        'die', 'died', 'dying',
        'send', 'sent', 'sending',
        'expect', 'expected', 'expecting',
        'build', 'built', 'building',
        'stay', 'stayed', 'staying',
        'fall', 'fell', 'fallen', 'falling',
        'cut', 'cutting',
        'reach', 'reached', 'reaching',
        'kill', 'killed', 'killing',
        'remain', 'remained', 'remaining',
        'raise', 'raised', 'raising',
        'pass', 'passed', 'passing',
        'sell', 'sold', 'selling',
        'decide', 'decided', 'deciding',
        'return', 'returned', 'returning',
        'explain', 'explained', 'explaining',
        'hope', 'hoped', 'hoping',
        'develop', 'developed', 'developing',
        'carry', 'carried', 'carrying',
        'break', 'broke', 'broken', 'breaking',
        'receive', 'received', 'receiving',
        'agree', 'agreed', 'agreeing',
        'support', 'supported', 'supporting',
        'hit', 'hitting',
        'produce', 'produced', 'producing',
        'eat', 'ate', 'eaten', 'eating',
        'cover', 'covered', 'covering',
        'catch', 'caught', 'catching',
        'draw', 'drew', 'drawn', 'drawing',
        'choose', 'chose', 'chosen', 'choosing',
        'cause', 'caused', 'causing',
        // 常见形容词(过于基础的)
        'good', 'bad', 'great', 'small', 'large', 'big', 'little', 'old', 'new', 'young',
        'long', 'short', 'high', 'low', 'full', 'empty', 'easy', 'hard', 'difficult',
        'simple', 'same', 'different', 'right', 'wrong', 'real', 'true', 'false',
        'happy', 'sad', 'angry', 'tired', 'ready', 'busy', 'free', 'open', 'closed',
        'hot', 'cold', 'warm', 'cool', 'wet', 'dry', 'clean', 'dirty',
        'rich', 'poor', 'strong', 'weak', 'fast', 'slow', 'loud', 'quiet',
        'nice', 'fine', 'pretty', 'beautiful', 'ugly',
        'able', 'unable', 'sure', 'certain', 'clear', 'dark', 'light',
        'important', 'possible', 'impossible', 'necessary', 'common', 'normal',
        'usual', 'unusual', 'special', 'general', 'particular', 'specific', 'certain',
        'public', 'private', 'local', 'national', 'international', 'global',
        'first', 'last', 'next', 'previous', 'final', 'best', 'worst', 'better', 'worse',
        'best', 'least', 'most', 'more', 'less', 'fewer',
        // 名词(过于基础的)
        'time', 'year', 'day', 'week', 'month', 'hour', 'minute', 'second', 'moment',
        'people', 'person', 'man', 'woman', 'child', 'boy', 'girl', 'baby', 'friend',
        'family', 'father', 'mother', 'son', 'daughter', 'brother', 'sister', 'husband',
        'wife', 'parent', 'home', 'house', 'room', 'door', 'window', 'wall', 'floor',
        'place', 'area', 'land', 'world', 'country', 'city', 'town', 'street', 'road',
        'way', 'road', 'path', 'side', 'line', 'point', 'end', 'top', 'bottom',
        'thing', 'part', 'kind', 'sort', 'type', 'form', 'name', 'word', 'number',
        'work', 'job', 'business', 'money', 'price', 'cost', 'pay',
        'water', 'food', 'tea', 'coffee', 'milk', 'bread', 'meat', 'fish', 'egg',
        'dog', 'cat', 'horse', 'cow', 'bird', 'tree', 'flower', 'grass',
        'sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'snow', 'wind', 'fire',
        'car', 'bus', 'train', 'plane', 'boat', 'ship', 'bike', 'road',
        'book', 'paper', 'pen', 'pencil', 'table', 'chair', 'bed', 'cup', 'glass',
        'phone', 'letter', 'box', 'bag', 'key', 'clock', 'watch', 'game', 'play',
        'school', 'class', 'student', 'teacher', 'question', 'answer', 'test',
        'story', 'news', 'idea', 'fact', 'truth', 'reason', 'result', 'way',
        'life', 'death', 'health', 'sick', 'well', 'body', 'head', 'face', 'hand',
        'eye', 'ear', 'nose', 'mouth', 'foot', 'leg', 'arm', 'heart',
        'color', 'red', 'blue', 'green', 'yellow', 'white', 'black',
        'art', 'music', 'song', 'movie', 'show', 'party',
        'morning', 'evening', 'night', 'noon', 'afternoon',
        'summer', 'winter', 'spring', 'autumn', 'fall',
        'north', 'south', 'east', 'west',
        // 其他常见功能词
        'ok', 'okay', 'yes', 'yeah', 'no', 'not', 'please', 'thanks', 'thank',
        'hello', 'hi', 'hey', 'bye', 'goodbye', 'sorry', 'welcome',
        'lot', 'lots', 'ton', 'plenty', 'deal', 'bit', 'piece',
        'kind', 'sort', 'type', 'form', 'kind', 'way', 'manner', 'method',
        // 其他过于简单的副词
        'also', 'too', 'either', 'neither', 'else', 'instead', 'rather',
        'maybe', 'perhaps', 'probably', 'certainly', 'definitely', 'exactly',
        'always', 'never', 'often', 'sometimes', 'usually', 'rarely', 'seldom',
        // 其他过于简单的动词
        'use', 'used', 'using',
        'find', 'found', 'finding',
        'work', 'worked', 'working',
        'look', 'looked', 'looking',
        'seem', 'seemed', 'seeming',
        'feel', 'felt', 'feeling',
        'become', 'became', 'become', 'becoming',
        'help', 'helped', 'helping',
        'turn', 'turned', 'turning',
        'start', 'started', 'starting',
        'need', 'needed', 'needing',
        'mean', 'meant', 'meaning',
        'keep', 'kept', 'keeping',
        'let', 'letting',
        'put', 'putting',
        'seem', 'seemed', 'seeming',
        'play', 'played', 'playing',
        'hear', 'heard', 'hearing',
        'remember', 'remembered', 'remembering',
        'start', 'started', 'starting',
        'try', 'tried', 'trying',
        'ask', 'asked', 'asking',
        'sound', 'sounded', 'sounding'
    ];

    // 去重 + 转为 Set
    const _set = new Set(STOPWORDS.map(w => w.toLowerCase().trim()).filter(Boolean));

    // 暴露到全局
    window.BASIC_STOPLIST = {
        /**
         * 判断一个词是否在黑名单中
         * @param {string} word
         * @returns {boolean}
         */
        includes(word) {
            if (!word || typeof word !== 'string') return false;
            return _set.has(word.toLowerCase().trim());
        },

        /**
         * 过滤词数组,返回不在黑名单中的词
         * @param {Array} words - 词对象数组
         * @param {string} [key='en'] - 词字段名
         * @returns {Array}
         */
        filter(words, key = 'en') {
            if (!Array.isArray(words)) return [];
            return words.filter(w => !_set.has(String(w[key] || '').toLowerCase().trim()));
        },

        /**
         * 获取黑名单大小
         * @returns {number}
         */
        size() {
            return _set.size;
        },

        /**
         * 获取黑名单数组(用于调试)
         * @returns {string[]}
         */
        toArray() {
            return Array.from(_set);
        }
    };
})();
